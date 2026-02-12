"""
Data preprocessing and feature engineering for Home Credit Default Risk
FINAL reproducible logic - no experiments
"""

import numpy as np
import pandas as pd
import gc
from sklearn.preprocessing import LabelEncoder
from utils import Config, reduce_mem_usage, print_data_info, timer, save_pickle


@timer
def load_data(data_path=Config.DATA_PATH):
    """Load all Home Credit dataset files"""
    print(f"Loading data from: {data_path}")
    
    data = {}
    data['train'] = pd.read_csv(f'{data_path}{Config.TRAIN_FILE}')
    data['test'] = pd.read_csv(f'{data_path}{Config.TEST_FILE}')
    data['bureau'] = pd.read_csv(f'{data_path}{Config.BUREAU_FILE}')
    data['bureau_balance'] = pd.read_csv(f'{data_path}{Config.BUREAU_BALANCE_FILE}')
    data['prev_app'] = pd.read_csv(f'{data_path}{Config.PREV_APP_FILE}')
    data['pos_cash'] = pd.read_csv(f'{data_path}{Config.POS_CASH_FILE}')
    data['credit_card'] = pd.read_csv(f'{data_path}{Config.CREDIT_CARD_FILE}')
    data['installments'] = pd.read_csv(f'{data_path}{Config.INSTALLMENTS_FILE}')
    
    print(f"✓ Train shape: {data['train'].shape}")
    print(f"✓ Test shape: {data['test'].shape}")
    
    return data


@timer
def engineer_application_features(df):
    """Engineer features from application data"""
    df = df.copy()
    
    # Age features
    df['AGE_YEARS'] = -df['DAYS_BIRTH'] / 365
    
    # Employment features
    df['DAYS_EMPLOYED'].replace(365243, np.nan, inplace=True)
    df['EMPLOYMENT_YEARS'] = -df['DAYS_EMPLOYED'] / 365
    df['EMPLOYMENT_YEARS'].fillna(0, inplace=True)
    
    # Income features
    df['INCOME_PER_PERSON'] = df['AMT_INCOME_TOTAL'] / df['CNT_FAM_MEMBERS']
    df['INCOME_PER_CHILD'] = df['AMT_INCOME_TOTAL'] / (1 + df['CNT_CHILDREN'])
    
    # Credit features
    df['CREDIT_INCOME_RATIO'] = df['AMT_CREDIT'] / df['AMT_INCOME_TOTAL']
    df['ANNUITY_INCOME_RATIO'] = df['AMT_ANNUITY'] / df['AMT_INCOME_TOTAL']
    df['CREDIT_TERM'] = df['AMT_CREDIT'] / df['AMT_ANNUITY']
    df['CREDIT_GOODS_RATIO'] = df['AMT_CREDIT'] / df['AMT_GOODS_PRICE']
    
    # Payment features
    df['PAYMENT_RATE'] = df['AMT_ANNUITY'] / df['AMT_CREDIT']
    df['DAYS_EMPLOYED_PERCENT'] = df['DAYS_EMPLOYED'] / df['DAYS_BIRTH']
    
    # External source features
    df['EXT_SOURCE_MEAN'] = df[['EXT_SOURCE_1', 'EXT_SOURCE_2', 'EXT_SOURCE_3']].mean(axis=1)
    df['EXT_SOURCE_STD'] = df[['EXT_SOURCE_1', 'EXT_SOURCE_2', 'EXT_SOURCE_3']].std(axis=1)
    df['EXT_SOURCE_PROD'] = df['EXT_SOURCE_1'] * df['EXT_SOURCE_2'] * df['EXT_SOURCE_3']
    
    # Document features
    doc_cols = [col for col in df.columns if 'FLAG_DOCUMENT' in col]
    df['DOCUMENT_COUNT'] = df[doc_cols].sum(axis=1)
    
    # Contact features
    df['HAS_MOBILE'] = (df['FLAG_MOBIL'] == 1).astype(int)
    df['HAS_WORK_PHONE'] = (df['FLAG_WORK_PHONE'] == 1).astype(int)
    df['HAS_PHONE'] = (df['FLAG_PHONE'] == 1).astype(int)
    df['HAS_EMAIL'] = (df['FLAG_EMAIL'] == 1).astype(int)
    df['CONTACT_COUNT'] = df['HAS_MOBILE'] + df['HAS_WORK_PHONE'] + df['HAS_PHONE'] + df['HAS_EMAIL']
    
    # Region features
    df['REGION_RATING_DIFF'] = df['REGION_RATING_CLIENT'] - df['REGION_RATING_CLIENT_W_CITY']
    
    print(f"✓ Engineered application features: {df.shape}")
    return df


@timer
def aggregate_bureau_features(df_bureau, df_bureau_balance):
    """Aggregate features from bureau and bureau balance data"""
    
    # Bureau balance aggregations
    bb_agg = df_bureau_balance.groupby('SK_ID_BUREAU').agg({
        'MONTHS_BALANCE': ['min', 'max', 'mean'],
        'STATUS': lambda x: (x == 'C').sum()
    })
    bb_agg.columns = ['_'.join(col).upper() for col in bb_agg.columns]
    bb_agg.reset_index(inplace=True)
    
    # Merge with bureau
    bureau = df_bureau.merge(bb_agg, on='SK_ID_BUREAU', how='left')
    
    # Bureau aggregations by client
    bureau_agg = bureau.groupby('SK_ID_CURR').agg({
        'SK_ID_BUREAU': 'count',
        'DAYS_CREDIT': ['min', 'max', 'mean'],
        'CREDIT_DAY_OVERDUE': ['max', 'mean'],
        'DAYS_CREDIT_ENDDATE': ['min', 'max', 'mean'],
        'AMT_CREDIT_MAX_OVERDUE': 'max',
        'CNT_CREDIT_PROLONG': 'sum',
        'AMT_CREDIT_SUM': ['max', 'mean', 'sum'],
        'AMT_CREDIT_SUM_DEBT': ['max', 'mean', 'sum'],
        'AMT_CREDIT_SUM_OVERDUE': 'mean',
        'DAYS_CREDIT_UPDATE': ['min', 'max', 'mean'],
        'AMT_ANNUITY': ['max', 'mean']
    })
    
    bureau_agg.columns = ['BUREAU_' + '_'.join(col).upper() for col in bureau_agg.columns]
    
    # Active credits
    active = bureau[bureau['CREDIT_ACTIVE'] == 'Active'].groupby('SK_ID_CURR').agg({
        'SK_ID_BUREAU': 'count',
        'AMT_CREDIT_SUM_DEBT': 'sum'
    })
    active.columns = ['BUREAU_ACTIVE_COUNT', 'BUREAU_ACTIVE_DEBT']
    
    # Closed credits
    closed = bureau[bureau['CREDIT_ACTIVE'] == 'Closed'].groupby('SK_ID_CURR').agg({
        'SK_ID_BUREAU': 'count',
        'DAYS_CREDIT': 'max'
    })
    closed.columns = ['BUREAU_CLOSED_COUNT', 'BUREAU_CLOSED_DAYS_CREDIT_MAX']
    
    # Merge all bureau features
    bureau_agg = bureau_agg.merge(active, left_index=True, right_index=True, how='left')
    bureau_agg = bureau_agg.merge(closed, left_index=True, right_index=True, how='left')
    bureau_agg.reset_index(inplace=True)
    
    print(f"✓ Aggregated bureau features: {bureau_agg.shape}")
    return bureau_agg


@timer
def aggregate_previous_applications(df_prev):
    """Aggregate features from previous applications"""
    
    # Basic aggregations
    prev_agg = df_prev.groupby('SK_ID_CURR').agg({
        'SK_ID_PREV': 'count',
        'AMT_ANNUITY': ['min', 'max', 'mean'],
        'AMT_APPLICATION': ['min', 'max', 'mean'],
        'AMT_CREDIT': ['min', 'max', 'mean'],
        'AMT_DOWN_PAYMENT': ['min', 'max', 'mean'],
        'AMT_GOODS_PRICE': ['min', 'max', 'mean'],
        'HOUR_APPR_PROCESS_START': ['min', 'max', 'mean'],
        'RATE_DOWN_PAYMENT': ['min', 'max', 'mean'],
        'DAYS_DECISION': ['min', 'max', 'mean'],
        'CNT_PAYMENT': ['mean', 'sum']
    })
    
    prev_agg.columns = ['PREV_' + '_'.join(col).upper() for col in prev_agg.columns]
    
    # Approved applications
    approved = df_prev[df_prev['NAME_CONTRACT_STATUS'] == 'Approved'].groupby('SK_ID_CURR').agg({
        'SK_ID_PREV': 'count',
        'AMT_CREDIT': 'sum'
    })
    approved.columns = ['PREV_APPROVED_COUNT', 'PREV_APPROVED_CREDIT']
    
    # Refused applications
    refused = df_prev[df_prev['NAME_CONTRACT_STATUS'] == 'Refused'].groupby('SK_ID_CURR').agg({
        'SK_ID_PREV': 'count'
    })
    refused.columns = ['PREV_REFUSED_COUNT']
    
    # Merge
    prev_agg = prev_agg.merge(approved, left_index=True, right_index=True, how='left')
    prev_agg = prev_agg.merge(refused, left_index=True, right_index=True, how='left')
    prev_agg.reset_index(inplace=True)
    
    print(f"✓ Aggregated previous application features: {prev_agg.shape}")
    return prev_agg


@timer
def aggregate_installments(df_inst):
    """Aggregate features from installment payments"""
    
    # Payment difference and delay
    df_inst['PAYMENT_DIFF'] = df_inst['AMT_PAYMENT'] - df_inst['AMT_INSTALMENT']
    df_inst['PAYMENT_RATIO'] = df_inst['AMT_PAYMENT'] / df_inst['AMT_INSTALMENT']
    df_inst['DAYS_PAYMENT_DELAY'] = df_inst['DAYS_ENTRY_PAYMENT'] - df_inst['DAYS_INSTALMENT']
    
    # Aggregations
    inst_agg = df_inst.groupby('SK_ID_CURR').agg({
        'SK_ID_PREV': 'count',
        'NUM_INSTALMENT_NUMBER': ['max', 'mean'],
        'NUM_INSTALMENT_VERSION': ['max'],
        'DAYS_INSTALMENT': ['min', 'max', 'mean'],
        'DAYS_ENTRY_PAYMENT': ['min', 'max', 'mean'],
        'AMT_INSTALMENT': ['min', 'max', 'mean', 'sum'],
        'AMT_PAYMENT': ['min', 'max', 'mean', 'sum'],
        'PAYMENT_DIFF': ['min', 'max', 'mean', 'sum'],
        'PAYMENT_RATIO': ['min', 'max', 'mean'],
        'DAYS_PAYMENT_DELAY': ['min', 'max', 'mean']
    })
    
    inst_agg.columns = ['INST_' + '_'.join(col).upper() for col in inst_agg.columns]
    inst_agg.reset_index(inplace=True)
    
    print(f"✓ Aggregated installment features: {inst_agg.shape}")
    return inst_agg


@timer
def preprocess_data(train_df, test_df, target='TARGET'):
    """
    Final preprocessing pipeline
    - Encode categorical variables
    - Handle missing values
    - Align train and test
    """
    print("Starting preprocessing...")
    
    # Separate target
    y_train = train_df[target]
    train_df = train_df.drop(columns=[target])
    
    # Save IDs
    train_ids = train_df['SK_ID_CURR']
    test_ids = test_df['SK_ID_CURR']
    
    # Identify feature types
    categorical_cols = train_df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    print(f"Categorical features: {len(categorical_cols)}")
    
    # Encode categorical variables
    le = LabelEncoder()
    for col in categorical_cols:
        combined = pd.concat([train_df[col], test_df[col]], axis=0)
        combined_encoded = le.fit_transform(combined.astype(str))
        
        train_df[col] = combined_encoded[:len(train_df)]
        test_df[col] = combined_encoded[len(train_df):]
    
    # Drop ID column
    train_df = train_df.drop(columns=['SK_ID_CURR'])
    test_df = test_df.drop(columns=['SK_ID_CURR'])
    
    # Align columns
    train_df, test_df = train_df.align(test_df, join='inner', axis=1)
    
    print(f"Aligned shapes - Train: {train_df.shape}, Test: {test_df.shape}")
    
    # Handle missing values
    missing_pct = train_df.isnull().sum() / len(train_df) * 100
    high_missing_cols = missing_pct[missing_pct > (Config.MISSING_THRESHOLD * 100)].index.tolist()
    
    if len(high_missing_cols) > 0:
        print(f"Dropping {len(high_missing_cols)} columns with >{Config.MISSING_THRESHOLD*100}% missing")
        train_df = train_df.drop(columns=high_missing_cols)
        test_df = test_df.drop(columns=high_missing_cols)
    
    # Impute remaining missing values
    for col in train_df.columns:
        if train_df[col].isnull().sum() > 0:
            fill_value = train_df[col].median()
            train_df[col].fillna(fill_value, inplace=True)
            test_df[col].fillna(fill_value, inplace=True)
    
    # Replace infinites
    train_df = train_df.replace([np.inf, -np.inf], np.nan)
    test_df = test_df.replace([np.inf, -np.inf], np.nan)
    
    train_df = train_df.fillna(train_df.median())
    test_df = test_df.fillna(train_df.median())
    
    print(f"✓ Final shapes - Train: {train_df.shape}, Test: {test_df.shape}")
    print(f"✓ Train nulls: {train_df.isnull().sum().sum()}")
    print(f"✓ Test nulls: {test_df.isnull().sum().sum()}")
    
    return train_df, test_df, y_train, train_ids, test_ids


@timer
def run_preprocessing(data_path=Config.DATA_PATH, save_processed=True):
    """
    Main preprocessing pipeline
    """
    print("="*80)
    print("STARTING DATA PREPROCESSING PIPELINE")
    print("="*80)
    
    # Load data
    data = load_data(data_path)
    
    # Engineer application features
    train_fe = engineer_application_features(data['train'])
    test_fe = engineer_application_features(data['test'])
    
    # Aggregate bureau features
    bureau_agg = aggregate_bureau_features(data['bureau'], data['bureau_balance'])
    train_fe = train_fe.merge(bureau_agg, on='SK_ID_CURR', how='left')
    test_fe = test_fe.merge(bureau_agg, on='SK_ID_CURR', how='left')
    del bureau_agg
    gc.collect()
    
    # Aggregate previous applications
    prev_agg = aggregate_previous_applications(data['prev_app'])
    train_fe = train_fe.merge(prev_agg, on='SK_ID_CURR', how='left')
    test_fe = test_fe.merge(prev_agg, on='SK_ID_CURR', how='left')
    del prev_agg
    gc.collect()
    
    # Aggregate installments
    inst_agg = aggregate_installments(data['installments'])
    train_fe = train_fe.merge(inst_agg, on='SK_ID_CURR', how='left')
    test_fe = test_fe.merge(inst_agg, on='SK_ID_CURR', how='left')
    del inst_agg
    gc.collect()
    
    print(f"\nFeature engineering complete - Train: {train_fe.shape}, Test: {test_fe.shape}")
    
    # Final preprocessing
    X_train, X_test, y_train, train_ids, test_ids = preprocess_data(train_fe, test_fe)
    
    # Save processed data
    if save_processed:
        print("\nSaving processed data...")
        save_pickle(X_train, f'{Config.PROCESSED_PATH}X_train.pkl')
        save_pickle(X_test, f'{Config.PROCESSED_PATH}X_test.pkl')
        save_pickle(y_train, f'{Config.PROCESSED_PATH}y_train.pkl')
        save_pickle(train_ids, f'{Config.PROCESSED_PATH}train_ids.pkl')
        save_pickle(test_ids, f'{Config.PROCESSED_PATH}test_ids.pkl')
    
    print("\n" + "="*80)
    print("PREPROCESSING COMPLETE!")
    print("="*80)
    
    return X_train, X_test, y_train, train_ids, test_ids


if __name__ == "__main__":
    # Run preprocessing
    X_train, X_test, y_train, train_ids, test_ids = run_preprocessing()
    print(f"\n✓ Ready for training!")
    print(f"  X_train: {X_train.shape}")
    print(f"  X_test: {X_test.shape}")
    print(f"  y_train: {y_train.shape}")
