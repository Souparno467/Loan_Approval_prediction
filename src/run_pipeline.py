from preprocess import run_preprocessing
from train import run_training
from evaluate import run_evaluation_pipeline


def run_pipeline():
    """End-to-end Credit Risk ML pipeline for the backend."""
    print("Starting Credit Risk ML Pipeline")

    # 1) Data preprocessing
    X_train, X_test, y_train, train_ids, test_ids = run_preprocessing()
    print("Data preprocessing completed")

    # 2) Model training
    model, cv_scores, feature_importance = run_training(
        X_train,
        y_train,
        do_cv=True,
        save_model_flag=True,
    )
    print("Model training completed")

    # 3) Evaluation & test prediction
    # This will:
    # - Load the latest saved model
    # - Load processed data
    # - Run evaluation (including evaluate_model internally)
    # - Generate submission CSV
    submission = run_evaluation_pipeline(save_plots=True)
    print("Evaluation and prediction completed")
    print("Sample predictions:")
    print(submission.head())

    print("Pipeline finished successfully")


if __name__ == "__main__":
    run_pipeline()


