"""
Model training for Home Credit Default Risk
"""

import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
from utils import Config, timer, save_pickle, load_pickle
from datetime import datetime


@timer
def train_lightgbm(X_train, y_train, X_val=None, y_val=None, params=None):
    """
    Train LightGBM model
    
    Args:
        X_train: Training features
        y_train: Training target
        X_val: Validation features (optional)
        y_val: Validation target (optional)
        params: Model parameters
    
    Returns:
        Trained model
    """
    if params is None:
        params = Config.LGBM_PARAMS.copy()
    
    # Calculate scale_pos_weight for imbalanced data
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    params['scale_pos_weight'] = scale_pos_weight
    
    print(f"Training LightGBM with {len(X_train)} samples")
    print(f"Positive class weight: {scale_pos_weight:.2f}")
    
    # Create datasets
    lgb_train = lgb.Dataset(X_train, y_train)
    
    if X_val is not None and y_val is not None:
        lgb_val = lgb.Dataset(X_val, y_val, reference=lgb_train)
        valid_sets = [lgb_train, lgb_val]
        valid_names = ['train', 'valid']
    else:
        valid_sets = [lgb_train]
        valid_names = ['train']
    
    # Train with early stopping
    model = lgb.train(
        params,
        lgb_train,
        num_boost_round=Config.NUM_BOOST_ROUND,
        valid_sets=valid_sets,
        valid_names=valid_names,
        callbacks=[
            lgb.early_stopping(stopping_rounds=Config.EARLY_STOPPING_ROUNDS),
            lgb.log_evaluation(period=100)
        ]
    )
    
    print(f"✓ Training complete - Best iteration: {model.best_iteration}")
    
    return model


@timer
def cross_validate(X_train, y_train, n_splits=Config.N_SPLITS, params=None):
    """
    Perform k-fold cross-validation
    
    Args:
        X_train: Training features
        y_train: Training target
        n_splits: Number of CV folds
        params: Model parameters
    
    Returns:
        List of CV scores and trained models
    """
    print(f"Starting {n_splits}-Fold Cross-Validation...")
    
    if params is None:
        params = Config.LGBM_PARAMS.copy()
    
    cv_scores = []
    models = []
    feature_importance = []
    
    kfold = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=Config.RANDOM_STATE)
    
    for fold, (train_idx, val_idx) in enumerate(kfold.split(X_train, y_train), 1):
        print(f"\n{'='*60}")
        print(f"Fold {fold}/{n_splits}")
        print(f"{'='*60}")
        
        X_tr_fold = X_train.iloc[train_idx]
        X_val_fold = X_train.iloc[val_idx]
        y_tr_fold = y_train.iloc[train_idx]
        y_val_fold = y_train.iloc[val_idx]
        
        # Train model
        model = train_lightgbm(X_tr_fold, y_tr_fold, X_val_fold, y_val_fold, params)
        
        # Predict and score
        y_pred_fold = model.predict(X_val_fold, num_iteration=model.best_iteration)
        fold_score = roc_auc_score(y_val_fold, y_pred_fold)
        
        cv_scores.append(fold_score)
        models.append(model)
        
        # Feature importance
        fold_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance': model.feature_importance(importance_type='gain'),
            'fold': fold
        })
        feature_importance.append(fold_importance)
        
        print(f"Fold {fold} ROC AUC: {fold_score:.4f}")
    
    print(f"\n{'='*60}")
    print(f"Cross-Validation Results:")
    print(f"  Mean ROC AUC: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
    print(f"  All fold scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"{'='*60}")
    
    # Aggregate feature importance
    feature_importance_df = pd.concat(feature_importance, axis=0)
    feature_importance_agg = feature_importance_df.groupby('feature').agg({
        'importance': ['mean', 'std']
    }).reset_index()
    feature_importance_agg.columns = ['feature', 'importance_mean', 'importance_std']
    feature_importance_agg = feature_importance_agg.sort_values('importance_mean', ascending=False)
    
    return cv_scores, models, feature_importance_agg


@timer
def train_final_model(X_train, y_train, params=None, best_iteration=None):
    """
    Train final model on full training data
    
    Args:
        X_train: Full training features
        y_train: Full training target
        params: Model parameters
        best_iteration: Number of iterations to use
    
    Returns:
        Final trained model
    """
    print("Training final model on full training data...")
    
    if params is None:
        params = Config.LGBM_PARAMS.copy()
    
    # Calculate scale_pos_weight
    scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    params['scale_pos_weight'] = scale_pos_weight
    
    # Create dataset
    lgb_train = lgb.Dataset(X_train, y_train)
    
    # Use best_iteration if provided, otherwise train with early stopping
    if best_iteration is not None:
        num_boost_round = best_iteration
        callbacks = [lgb.log_evaluation(period=100)]
    else:
        num_boost_round = Config.NUM_BOOST_ROUND
        callbacks = [
            lgb.early_stopping(stopping_rounds=Config.EARLY_STOPPING_ROUNDS),
            lgb.log_evaluation(period=100)
        ]
    
    model = lgb.train(
        params,
        lgb_train,
        num_boost_round=num_boost_round,
        valid_sets=[lgb_train],
        valid_names=['train'],
        callbacks=callbacks
    )
    
    print(f"✓ Final model trained - Iterations: {model.best_iteration}")
    
    return model


@timer
def save_model(model, filepath=None):
    """Save trained model"""
    if filepath is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = f'{Config.MODEL_PATH}model_{timestamp}.pkl'
    
    save_pickle(model, filepath)
    return filepath


@timer
def run_training(X_train, y_train, do_cv=True, save_model_flag=True):
    """
    Main training pipeline
    
    Args:
        X_train: Training features
        y_train: Training target
        do_cv: Whether to perform cross-validation
        save_model_flag: Whether to save the final model
    
    Returns:
        Final model, CV scores (if do_cv=True), feature importance
    """
    print("="*80)
    print("STARTING MODEL TRAINING PIPELINE")
    print("="*80)
    
    cv_scores = None
    feature_importance = None
    best_iteration = None
    
    if do_cv:
        # Cross-validation
        cv_scores, cv_models, feature_importance = cross_validate(X_train, y_train)
        
        # Use mean best iteration from CV
        best_iteration = int(np.mean([m.best_iteration for m in cv_models]))
        print(f"\nUsing average best iteration: {best_iteration}")
    
    # Train final model
    final_model = train_final_model(X_train, y_train, best_iteration=best_iteration)
    
    # Get feature importance from final model
    if feature_importance is None:
        feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance_mean': final_model.feature_importance(importance_type='gain'),
            'importance_std': 0
        }).sort_values('importance_mean', ascending=False)
    
    # Save model
    if save_model_flag:
        model_path = save_model(final_model)
        print(f"Model saved to: {model_path}")
    
    # Save feature importance
    importance_path = f'{Config.MODEL_PATH}feature_importance.csv'
    feature_importance.to_csv(importance_path, index=False)
    print(f"Feature importance saved to: {importance_path}")
    
    print("\n" + "="*80)
    print("TRAINING COMPLETE!")
    print("="*80)
    
    return final_model, cv_scores, feature_importance


if __name__ == "__main__":
    # Load preprocessed data
    print("Loading preprocessed data...")
    X_train = load_pickle(f'{Config.PROCESSED_PATH}X_train.pkl')
    y_train = load_pickle(f'{Config.PROCESSED_PATH}y_train.pkl')
    
    print(f"X_train shape: {X_train.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"Default rate: {y_train.mean():.2%}")
    
    # Run training
    model, cv_scores, feature_importance = run_training(X_train, y_train, do_cv=True)
    
    print(f"\n✓ Training complete!")
    if cv_scores:
        print(f"  CV ROC AUC: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
    
    print(f"\nTop 10 Most Important Features:")
    print(feature_importance.head(10)[['feature', 'importance_mean']])
