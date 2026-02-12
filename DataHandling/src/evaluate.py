"""
Model evaluation and prediction for Home Credit Default Risk
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    roc_auc_score, roc_curve, confusion_matrix, 
    classification_report, precision_recall_curve
)
from utils import Config, timer, load_pickle, save_pickle
from datetime import datetime
import os


@timer
def evaluate_model(model, X_val, y_val, threshold=0.5):
    """
    Evaluate model performance on validation set
    
    Args:
        model: Trained model
        X_val: Validation features
        y_val: Validation target
        threshold: Classification threshold
    
    Returns:
        Dictionary of evaluation metrics
    """
    print("Evaluating model...")
    
    # Get predictions
    y_pred_proba = model.predict(X_val, num_iteration=model.best_iteration)
    y_pred = (y_pred_proba >= threshold).astype(int)
    
    # Calculate metrics
    roc_auc = roc_auc_score(y_val, y_pred_proba)
    
    metrics = {
        'roc_auc': roc_auc,
        'threshold': threshold,
        'predictions_proba': y_pred_proba,
        'predictions': y_pred
    }
    
    print(f"✓ ROC AUC Score: {roc_auc:.4f}")
    
    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_val, y_pred, target_names=['No Default', 'Default']))
    
    return metrics


@timer
def find_optimal_threshold(y_true, y_pred_proba):
    """
    Find optimal classification threshold using Youden's J statistic
    
    Args:
        y_true: True labels
        y_pred_proba: Predicted probabilities
    
    Returns:
        Optimal threshold
    """
    fpr, tpr, thresholds = roc_curve(y_true, y_pred_proba)
    
    # Youden's J statistic: TPR - FPR
    j_scores = tpr - fpr
    optimal_idx = np.argmax(j_scores)
    optimal_threshold = thresholds[optimal_idx]
    
    print(f"Optimal Threshold: {optimal_threshold:.4f}")
    print(f"  TPR: {tpr[optimal_idx]:.4f}")
    print(f"  FPR: {fpr[optimal_idx]:.4f}")
    
    return optimal_threshold


@timer
def plot_roc_curve(y_true, y_pred_proba, save_path=None):
    """Plot ROC curve"""
    fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
    roc_auc = roc_auc_score(y_true, y_pred_proba)
    
    plt.figure(figsize=(10, 8))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12, fontweight='bold')
    plt.ylabel('True Positive Rate', fontsize=12, fontweight='bold')
    plt.title('ROC Curve', fontsize=14, fontweight='bold')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ ROC curve saved to: {save_path}")
    
    plt.show()


@timer
def plot_precision_recall_curve(y_true, y_pred_proba, save_path=None):
    """Plot Precision-Recall curve"""
    precision, recall, _ = precision_recall_curve(y_true, y_pred_proba)
    
    plt.figure(figsize=(10, 8))
    plt.plot(recall, precision, color='blue', lw=2)
    plt.xlabel('Recall', fontsize=12, fontweight='bold')
    plt.ylabel('Precision', fontsize=12, fontweight='bold')
    plt.title('Precision-Recall Curve', fontsize=14, fontweight='bold')
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Precision-Recall curve saved to: {save_path}")
    
    plt.show()


@timer
def plot_confusion_matrix(y_true, y_pred, threshold, save_path=None):
    """Plot confusion matrix"""
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.xlabel('Predicted', fontsize=12, fontweight='bold')
    plt.ylabel('Actual', fontsize=12, fontweight='bold')
    plt.title(f'Confusion Matrix (Threshold={threshold:.4f})', fontsize=14, fontweight='bold')
    plt.xticks([0.5, 1.5], ['No Default', 'Default'])
    plt.yticks([0.5, 1.5], ['No Default', 'Default'])
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Confusion matrix saved to: {save_path}")
    
    plt.show()


@timer
def plot_feature_importance(feature_importance_df, top_n=20, save_path=None):
    """Plot feature importance"""
    top_features = feature_importance_df.head(top_n)
    
    plt.figure(figsize=(12, 8))
    plt.barh(range(len(top_features)), top_features['importance_mean'], color='teal')
    plt.yticks(range(len(top_features)), top_features['feature'])
    plt.xlabel('Importance (Gain)', fontsize=12, fontweight='bold')
    plt.ylabel('Features', fontsize=12, fontweight='bold')
    plt.title(f'Top {top_n} Feature Importance', fontsize=14, fontweight='bold')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Feature importance plot saved to: {save_path}")
    
    plt.show()


@timer
def create_risk_segments(predictions, thresholds=[0.1, 0.3, 0.5]):
    """
    Segment customers by risk level
    
    Args:
        predictions: Predicted probabilities
        thresholds: Threshold values for segmentation
    
    Returns:
        Array of risk segments
    """
    segments = []
    for pred in predictions:
        if pred < thresholds[0]:
            segments.append('Very Low Risk')
        elif pred < thresholds[1]:
            segments.append('Low Risk')
        elif pred < thresholds[2]:
            segments.append('Medium Risk')
        else:
            segments.append('High Risk')
    
    return np.array(segments)


@timer
def predict_test_set(model, X_test, test_ids):
    """
    Generate predictions on test set
    
    Args:
        model: Trained model
        X_test: Test features
        test_ids: Test set IDs
    
    Returns:
        Submission dataframe
    """
    print("Generating predictions on test set...")
    
    test_predictions = model.predict(X_test, num_iteration=model.best_iteration)
    
    # Create submission
    submission = pd.DataFrame({
        'SK_ID_CURR': test_ids,
        'TARGET': test_predictions
    })
    
    print(f"✓ Predictions generated for {len(submission)} samples")
    print(f"\nPrediction Statistics:")
    print(submission['TARGET'].describe())
    
    # Add risk segments
    submission['RISK_SEGMENT'] = create_risk_segments(submission['TARGET'])
    
    print(f"\nRisk Segmentation:")
    print(submission['RISK_SEGMENT'].value_counts())
    
    return submission


@timer
def save_submission(submission, filename=None):
    """Save submission file"""
    if filename is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'submission_{timestamp}.csv'
    
    # Save only required columns
    submission[['SK_ID_CURR', 'TARGET']].to_csv(filename, index=False)
    print(f"✓ Submission saved to: {filename}")
    
    return filename


@timer
def run_evaluation_pipeline(model_path=None, save_plots=True):
    """
    Main evaluation pipeline
    
    Args:
        model_path: Path to trained model (if None, loads latest)
        save_plots: Whether to save evaluation plots
    
    Returns:
        Submission dataframe
    """
    print("="*80)
    print("STARTING EVALUATION PIPELINE")
    print("="*80)
    
    # Load model
    if model_path is None:
        # Find latest model
        model_files = [f for f in os.listdir(Config.MODEL_PATH) if f.startswith('model_') and f.endswith('.pkl')]
        if not model_files:
            raise FileNotFoundError("No model found in models directory")
        model_path = os.path.join(Config.MODEL_PATH, sorted(model_files)[-1])
    
    print(f"Loading model from: {model_path}")
    model = load_pickle(model_path)
    
    # Load data
    print("\nLoading data...")
    X_test = load_pickle(f'{Config.PROCESSED_PATH}X_test.pkl')
    test_ids = load_pickle(f'{Config.PROCESSED_PATH}test_ids.pkl')
    
    # Try to load validation data for evaluation
    try:
        X_train = load_pickle(f'{Config.PROCESSED_PATH}X_train.pkl')
        y_train = load_pickle(f'{Config.PROCESSED_PATH}y_train.pkl')
        
        # Use a small validation split for evaluation
        from sklearn.model_selection import train_test_split
        _, X_val, _, y_val = train_test_split(
            X_train, y_train, test_size=0.2, 
            random_state=Config.RANDOM_STATE, stratify=y_train
        )
        
        print(f"Validation set: {X_val.shape}")
        
        # Evaluate on validation set
        metrics = evaluate_model(model, X_val, y_val)
        
        # Find optimal threshold
        optimal_threshold = find_optimal_threshold(y_val, metrics['predictions_proba'])
        
        # Re-evaluate with optimal threshold
        print(f"\nRe-evaluating with optimal threshold...")
        metrics_optimal = evaluate_model(model, X_val, y_val, threshold=optimal_threshold)
        
        if save_plots:
            print("\nGenerating evaluation plots...")
            plot_roc_curve(y_val, metrics['predictions_proba'], 
                          save_path=f'{Config.MODEL_PATH}roc_curve.png')
            plot_precision_recall_curve(y_val, metrics['predictions_proba'],
                                       save_path=f'{Config.MODEL_PATH}pr_curve.png')
            plot_confusion_matrix(y_val, metrics_optimal['predictions'], optimal_threshold,
                                 save_path=f'{Config.MODEL_PATH}confusion_matrix.png')
            
            # Plot feature importance
            feature_importance = pd.read_csv(f'{Config.MODEL_PATH}feature_importance.csv')
            plot_feature_importance(feature_importance, 
                                   save_path=f'{Config.MODEL_PATH}feature_importance.png')
        
    except FileNotFoundError:
        print("Validation data not found, skipping evaluation plots")
    
    # Generate test predictions
    submission = predict_test_set(model, X_test, test_ids)
    
    # Save submission
    submission_path = save_submission(submission)
    
    print("\n" + "="*80)
    print("EVALUATION COMPLETE!")
    print("="*80)
    print(f"Submission ready: {submission_path}")
    
    return submission


if __name__ == "__main__":
    # Run evaluation pipeline
    submission = run_evaluation_pipeline(save_plots=True)
    
    print(f"\n✓ Evaluation complete!")
    print(f"  Submission shape: {submission.shape}")
    print(f"  Mean prediction: {submission['TARGET'].mean():.4f}")
