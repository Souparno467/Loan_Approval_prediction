"""
Utility functions for Home Credit Default Risk modeling
"""

import numpy as np
import pandas as pd
import os
import pickle
import json
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')


class Config:
    """Configuration class for project settings"""
    
    # Paths (corrected to match your project structure)
    DATA_PATH = './raw/'            # raw CSVs inside DATAHANDLING/raw
    PROCESSED_PATH = './processed/' # processed outputs
    MODEL_PATH = './models/'        # trained models
    
    # Data files
    TRAIN_FILE = 'application_train.csv'
    TEST_FILE = 'application_test.csv'
    BUREAU_FILE = 'bureau.csv'
    BUREAU_BALANCE_FILE = 'bureau_balance.csv'
    PREV_APP_FILE = 'previous_application.csv'
    POS_CASH_FILE = 'POS_CASH_balance.csv'
    CREDIT_CARD_FILE = 'credit_card_balance.csv'
    INSTALLMENTS_FILE = 'installments_payments.csv'
    
    # Model parameters
    RANDOM_STATE = 42
    TEST_SIZE = 0.2
    N_SPLITS = 5
    
    # Feature engineering
    MISSING_THRESHOLD = 0.7
    
    # LightGBM parameters
    LGBM_PARAMS = {
        'objective': 'binary',
        'metric': 'auc',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.8,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'max_depth': -1,
        'min_child_samples': 20,
        'random_state': 42,
        'n_jobs': -1,
        'verbose': -1
    }
    
    NUM_BOOST_ROUND = 1000
    EARLY_STOPPING_ROUNDS = 50


def setup_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        Config.PROCESSED_PATH,
        Config.MODEL_PATH
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"[OK] Directory ready: {directory}")


def save_pickle(obj, filepath):
    """Save object as pickle file"""
    with open(filepath, 'wb') as f:
        pickle.dump(obj, f)
    print(f"[OK] Saved: {filepath}")


def load_pickle(filepath):
    """Load pickle file"""
    with open(filepath, 'rb') as f:
        obj = pickle.load(f)
    print(f"[OK] Loaded: {filepath}")
    return obj


def save_json(obj, filepath):
    """Save object as JSON file"""
    with open(filepath, 'w') as f:
        json.dump(obj, f, indent=4)
    print(f"[OK] Saved: {filepath}")


def load_json(filepath):
    """Load JSON file"""
    with open(filepath, 'r') as f:
        obj = json.load(f)
    print(f"[OK] Loaded: {filepath}")
    return obj


def load_model_registry():
    """
    Load the central model registry that tracks production and candidate models.
    """
    registry_path = os.path.join(Config.MODEL_PATH, 'model_registry.json')
    if not os.path.exists(registry_path):
        raise FileNotFoundError(f"Model registry not found at: {registry_path}")
    return load_json(registry_path)


def load_production_model():
    """
    Load the production model defined in the model registry.
    This is the single source of truth for which model the backend should serve.
    """
    registry = load_model_registry()
    model_name = registry.get('production_model')
    if not model_name:
        raise ValueError("Model registry missing 'production_model' entry")

    model_path = os.path.join(Config.MODEL_PATH, model_name)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Production model file not found at: {model_path}")

    model = load_pickle(model_path)
    return model


def load_feature_schema():
    """
    Load or generate the feature schema used for inference.
    - If models/feature_schema.json exists and has features, use it.
    - Otherwise, derive features from processed X_train and write schema.
    """
    schema_path = os.path.join(Config.MODEL_PATH, 'feature_schema.json')

    # If a schema already exists and is non-empty, use it
    if os.path.exists(schema_path):
        schema = load_json(schema_path)
        features = schema.get('features') or []
        if features:
            return schema

    # Fallback: derive schema from processed training data
    processed_x_path = os.path.join(Config.PROCESSED_PATH, 'X_train.pkl')
    if not os.path.exists(processed_x_path):
        raise FileNotFoundError(
            f"Feature schema not found and processed X_train missing at: {processed_x_path}"
        )

    X_train = load_pickle(processed_x_path)
    features = list(X_train.columns)

    schema = {
        'features': features,
        'source': processed_x_path,
        'last_updated': datetime.now().strftime('%Y-%m-%d')
    }
    save_json(schema, schema_path)
    return schema


def reduce_mem_usage(df, verbose=True):
    """Reduce memory usage by downcasting numeric types"""
    start_mem = df.memory_usage().sum() / 1024**2
    
    for col in df.columns:
        col_type = df[col].dtype
        
        if col_type != object:
            c_min = df[col].min()
            c_max = df[col].max()
            
            if str(col_type)[:3] == 'int':
                if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                    df[col] = df[col].astype(np.int8)
                elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                    df[col] = df[col].astype(np.int16)
                elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                    df[col] = df[col].astype(np.int32)
                elif c_min > np.iinfo(np.int64).min and c_max < np.iinfo(np.int64).max:
                    df[col] = df[col].astype(np.int64)
            else:
                if c_min > np.finfo(np.float32).min and c_max < np.finfo(np.float32).max:
                    df[col] = df[col].astype(np.float32)
                else:
                    df[col] = df[col].astype(np.float64)
    
    end_mem = df.memory_usage().sum() / 1024**2
    
    if verbose:
        print(f"Memory usage: {start_mem:.2f} MB -> {end_mem:.2f} MB "
              f"({100 * (start_mem - end_mem) / start_mem:.1f}% reduction)")
    
    return df


def print_data_info(df, name='DataFrame'):
    """Print comprehensive dataframe information"""
    print(f"\n{'='*80}")
    print(f"{name.upper()} INFORMATION")
    print(f"{'='*80}")
    print(f"Shape: {df.shape[0]:,} rows x {df.shape[1]} columns")
    print(f"\nData Types:")
    print(df.dtypes.value_counts())
    print(f"\nMemory Usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    
    missing = df.isnull().sum()
    missing_pct = 100 * missing / len(df)
    missing_df = pd.DataFrame({
        'Missing_Count': missing,
        'Percentage': missing_pct
    }).sort_values('Percentage', ascending=False)
    
    if missing_df['Percentage'].sum() > 0:
        print(f"\nColumns with Missing Values (Top 10):")
        print(missing_df[missing_df['Percentage'] > 0].head(10))
    else:
        print(f"\n✓ No missing values!")


def timer(func):
    """Decorator to time function execution"""
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        print(f"\n[{start_time.strftime('%H:%M:%S')}] Starting {func.__name__}...")
        
        result = func(*args, **kwargs)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"[{end_time.strftime('%H:%M:%S')}] Completed {func.__name__} in {duration:.2f}s")
        
        return result
    return wrapper


if __name__ == "__main__":
    print("Utility functions loaded successfully!")
    setup_directories()
