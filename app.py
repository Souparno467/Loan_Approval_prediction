"""
Flask Backend API for ML Model Application
Provides endpoints for data processing, model training, evaluation, and predictions
"""

from flask import Flask, request, jsonify, send_file, redirect
from flask_cors import CORS
import os
import sys
import pickle
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
import json
from datetime import datetime
import traceback
# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import custom modules
try:
    from src.preprocess import preprocess_data, load_data
    from src.train import train_lightgbm, run_training, save_model
    from src.evaluate import evaluate_model
    from src.utils import load_pickle, save_pickle, Config
except ImportError as e:
    print(f"Warning: Could not import custom modules: {e}")
    print("Make sure all required modules are in the src directory")

# Utility functions for Flask
def allowed_file(filename, allowed_extensions):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def create_response(message, data=None, status='success'):
    """Create standardized API response"""
    return {
        'status': status,
        'message': message,
        'data': data or {}
    }

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'csv', 'pkl', 'json'}

# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/predict": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Create required directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(Config.MODEL_PATH, exist_ok=True)
os.makedirs(Config.PROCESSED_PATH, exist_ok=True)

# Global variables
current_model = None
model_metadata = {}
feature_columns = None
feature_medians = {}


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current application status"""
    return jsonify({
        'model_loaded': current_model is not None,
        'model_info': model_metadata,
        'upload_folder': app.config['UPLOAD_FOLDER'],
        'max_file_size': app.config['MAX_CONTENT_LENGTH']
    }), 200


# ============================================================================
# DATA UPLOAD AND PREPROCESSING ENDPOINTS
# ============================================================================

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload CSV data file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in request'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename, app.config['ALLOWED_EXTENSIONS']):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            file.save(filepath)
            
            # Get basic file info
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
                file_info = {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': df.columns.tolist(),
                    'dtypes': df.dtypes.astype(str).to_dict()
                }
            else:
                file_info = {}
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'filepath': filepath,
                'file_info': file_info
            }), 200
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({
            'error': 'Upload failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/preprocess', methods=['POST'])
def preprocess():
    """Preprocess uploaded data"""
    try:
        data = request.get_json()
        
        # Preprocess using the configured data paths
        print("Loading data...")
        all_data = load_data()
        
        train_df = all_data['train']
        test_df = all_data['test']
        
        target = data.get('target', 'TARGET') if data else 'TARGET'
        
        print(f"Preprocessing with target: {target}")
        X_train, X_test, y_train = preprocess_data(train_df, test_df, target=target)
        
        return jsonify({
            'message': 'Data preprocessed successfully',
            'X_train_shape': X_train.shape,
            'X_test_shape': X_test.shape,
            'y_train_shape': y_train.shape,
            'features': X_train.columns.tolist()
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Preprocessing failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/data/info', methods=['POST'])
def get_data_info():
    """Get information about a dataset"""
    try:
        data = request.get_json()
        filepath = data.get('filepath')
        
        if not filepath or not os.path.exists(filepath):
            return jsonify({'error': 'Invalid filepath'}), 400
        
        df = pd.read_csv(filepath)
        
        info = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'statistics': df.describe().to_dict(),
            'sample_data': df.head(5).to_dict(orient='records')
        }
        
        return jsonify(info), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to get data info',
            'details': str(e)
        }), 500


# ============================================================================
# MODEL TRAINING ENDPOINTS
# ============================================================================

@app.route('/api/train', methods=['POST'])
def train():
    """Train a machine learning model"""
    global current_model, model_metadata
    
    try:
        data = request.get_json() if request.is_json else {}
        
        # Load and preprocess data
        print("Loading data...")
        all_data = load_data()
        train_df = all_data['train']
        test_df = all_data['test']
        
        target = data.get('target', 'TARGET')
        
        print(f"Preprocessing with target: {target}")
        X_train, X_test, y_train = preprocess_data(train_df, test_df, target=target)
        
        # Get training parameters
        do_cv = data.get('do_cv', True) if data else True
        save_model_flag = data.get('save_model', True) if data else True
        
        print(f"Training model with do_cv={do_cv}, save_model={save_model_flag}")
        # Train model
        model, cv_scores, feature_importance = run_training(
            X_train, 
            y_train, 
            do_cv=do_cv, 
            save_model_flag=save_model_flag
        )
        
        current_model = model
        
        model_metadata = {
            'trained_at': datetime.now().isoformat(),
            'cv_scores': cv_scores,
            'feature_importance_shape': feature_importance.shape if feature_importance is not None else None,
            'training_samples': len(X_train),
            'training_features': X_train.shape[1]
        }
        
        return jsonify({
            'message': 'Model trained successfully',
            'model_info': model_metadata,
            'cv_scores': str(cv_scores) if cv_scores is not None else None
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Training failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/models', methods=['GET'])
def list_models():
    """List all available models"""
    try:
        models_dir = Config.MODEL_PATH
        if not os.path.exists(models_dir):
            return jsonify({'models': []}), 200
        
        models = []
        for filename in os.listdir(models_dir):
            if filename.endswith('.pkl'):
                filepath = os.path.join(models_dir, filename)
                models.append({
                    'filename': filename,
                    'filepath': filepath,
                    'size': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                })
        
        return jsonify({'models': models}), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to list models',
            'details': str(e)
        }), 500


@app.route('/api/model/load', methods=['POST'])
def load_model_endpoint():
    """Load a specific model"""
    global current_model, model_metadata
    
    try:
        data = request.get_json()
        model_path = data.get('model_path')
        
        if not model_path or not os.path.exists(model_path):
            return jsonify({'error': 'Model file not found'}), 404
        
        current_model = load_pickle(model_path)
        
        model_metadata = {
            'model_path': model_path,
            'loaded_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'message': 'Model loaded successfully',
            'model_info': model_metadata
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to load model',
            'details': str(e)
        }), 500


# ============================================================================
# EVALUATION ENDPOINTS
# ============================================================================

@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """Evaluate the current model"""
    try:
        if current_model is None:
            return jsonify({'error': 'No model loaded'}), 400
        
        data = request.get_json() if request.is_json else {}
        threshold = data.get('threshold', 0.5) if data else 0.5
        
        # Load and preprocess data for evaluation
        all_data = load_data()
        train_df = all_data['train']
        test_df = all_data['test']
        
        target = data.get('target', 'TARGET') if data else 'TARGET'
        
        X_train, X_test, y_train = preprocess_data(train_df, test_df, target=target)
        
        # Evaluate model on test set
        results = evaluate_model(current_model, X_test, y_train, threshold=threshold)
        
        return jsonify({
            'message': 'Evaluation completed',
            'results': results
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Evaluation failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get available model metrics and visualizations"""
    try:
        metrics_dir = Config.MODEL_PATH
        metrics = {}
        
        # Check for various metric files
        metric_files = {
            'confusion_matrix': 'confusion_matrix.png',
            'roc_curve': 'roc_curve.png',
            'pr_curve': 'pr_curve.png',
            'feature_importance': 'feature_importance.csv'
        }
        
        for metric_name, filename in metric_files.items():
            filepath = os.path.join(metrics_dir, filename)
            if os.path.exists(filepath):
                metrics[metric_name] = filepath
        
        return jsonify({'metrics': metrics}), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to get metrics',
            'details': str(e)
        }), 500


@app.route('/api/metrics/<metric_type>', methods=['GET'])
def get_metric_file(metric_type):
    """Get a specific metric file"""
    try:
        metrics_dir = Config.MODEL_PATH
        
        metric_files = {
            'confusion_matrix': 'confusion_matrix.png',
            'roc_curve': 'roc_curve.png',
            'pr_curve': 'pr_curve.png',
            'feature_importance': 'feature_importance.csv'
        }
        
        if metric_type not in metric_files:
            return jsonify({'error': 'Invalid metric type'}), 400
        
        filepath = os.path.join(metrics_dir, metric_files[metric_type])
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Metric file not found'}), 404
        
        return send_file(filepath)
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve metric',
            'details': str(e)
        }), 500


# ============================================================================
# PREDICTION AND LOAN MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/loans', methods=['GET'])
def get_loans():
    """Fetch loan data"""
    try:
        # Add your logic to fetch loans here
        loans = [
            {"id": 1, "amount": 1000, "status": "approved"},
            {"id": 2, "amount": 2000, "status": "pending"}
        ]
        return jsonify(loans), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to fetch loans',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/apply', methods=['POST'])
def apply_loan():
    """Handle loan applications"""
    try:
        data = request.get_json()
        # Add your loan application logic here
        response = {"message": "Loan application received", "data": data}
        return jsonify(response), 200
    except Exception as e:
        return jsonify({
            'error': 'Loan application failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ============================================================================
# PREDICTION ENDPOINTS
# ============================================================================


@app.route('/predict', methods=['POST', 'OPTIONS'])
def redirect_predict():
    print("[DEBUG] Received request on /predict")
    # Delegate to the main handler
    return handle_predict()


@app.route('/api/predict', methods=['POST', 'OPTIONS'])
def handle_predict():
    """Make predictions with the current model"""
    print("[DEBUG] Received request on /api/predict")
    # Handle preflight immediately
    if request.method == 'OPTIONS':
        return '', 200
    try:
        if current_model is None:
            print("[DEBUG] No model loaded")
            return jsonify({'error': 'No model loaded'}), 400

        data = request.get_json() or {}
        print(f"[DEBUG] Request data: {data}")

        # If client provides a numeric feature array use it directly
        if 'features' in data:
            features = np.array(data['features']).reshape(1, -1)
            X_input = features

        # If client provides a filepath, run batch predictions from CSV
        elif 'filepath' in data:
            filepath = data['filepath']
            if not os.path.exists(filepath):
                print("[DEBUG] File not found")
                return jsonify({'error': 'File not found'}), 404

            df = pd.read_csv(filepath)
            X_input = df

        # If client provides a mapping of feature_name->value, build single-row input
        elif isinstance(data, dict) and any(k in data for k in ("SK_ID_CURR",)) or isinstance(data, dict):
            # Build a single-row DataFrame using training feature columns and medians for missing values
            if feature_columns is None:
                return jsonify({'error': 'Server missing feature metadata (X_train). Cannot build input from partial fields.'}), 500

            row = {}
            for col in feature_columns:
                if col in data:
                    row[col] = data[col]
                else:
                    # fill with median from training
                    row[col] = feature_medians.get(col, 0)

            X_input = pd.DataFrame([row], columns=feature_columns)

        else:
            print("[DEBUG] Invalid input format")
            return jsonify({'error': 'Invalid input format. Provide "features" array, a CSV filepath, or a mapping of feature_name->value.'}), 400

        # Run prediction
        preds = current_model.predict(X_input)

        probabilities = None
        if hasattr(current_model, 'predict_proba'):
            probabilities = current_model.predict_proba(X_input).tolist()

        # Format single vs batch responses
        if isinstance(preds, np.ndarray) and preds.shape[0] == 1:
            pred_out = preds[0].tolist() if isinstance(preds[0], np.ndarray) else preds[0]
            prob_out = probabilities[0] if probabilities is not None else None
            return jsonify({'prediction': pred_out, 'probability': prob_out}), 200
        else:
            return jsonify({'predictions': preds.tolist(), 'probabilities': probabilities, 'count': len(preds)}), 200
    
    except Exception as e:
        print(f"[DEBUG] Prediction failed: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/features', methods=['GET'])
def get_features():
    """Return expected feature column order and medians for missing values"""
    try:
        if feature_columns is None:
            return jsonify({'error': 'Feature metadata not available on server'}), 500
        return jsonify({'feature_columns': feature_columns, 'feature_medians': feature_medians}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to return features', 'details': str(e)}), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """Make batch predictions"""
    try:
        if current_model is None:
            return jsonify({'error': 'No model loaded'}), 400
        
        data = request.get_json()
        features_list = data.get('features_list', [])
        
        if not features_list:
            return jsonify({'error': 'No features provided'}), 400
        
        features = np.array(features_list)
        predictions = current_model.predict(features)
        
        # Get probabilities if available
        probabilities = None
        if hasattr(current_model, 'predict_proba'):
            probabilities = current_model.predict_proba(features).tolist()
        
        return jsonify({
            'predictions': predictions.tolist(),
            'probabilities': probabilities,
            'count': len(predictions)
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Batch prediction failed',
            'details': str(e)
        }), 500


# ============================================================================
# FILE MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/files', methods=['GET'])
def list_files():
    """List uploaded files"""
    try:
        files = []
        upload_dir = app.config['UPLOAD_FOLDER']
        
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                filepath = os.path.join(upload_dir, filename)
                files.append({
                    'filename': filename,
                    'filepath': filepath,
                    'size': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                })
        
        return jsonify({'files': files}), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to list files',
            'details': str(e)
        }), 500


@app.route('/api/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete an uploaded file"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        os.remove(filepath)
        
        return jsonify({'message': 'File deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Failed to delete file',
            'details': str(e)
        }), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print(f"Starting Flask server on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Upload folder: {app.config['UPLOAD_FOLDER']}")

    # Try to auto-load the most recent model from Config.MODEL_PATH
    try:
        model_dir = Config.MODEL_PATH
        if os.path.exists(model_dir):
            pkl_files = [os.path.join(model_dir, f) for f in os.listdir(model_dir) if f.endswith('.pkl')]
            if pkl_files:
                latest = max(pkl_files, key=os.path.getmtime)
                try:
                    print(f"Attempting to load model: {latest}")
                    current_model = load_pickle(latest)
                    model_metadata.update({'model_path': latest, 'loaded_at': datetime.now().isoformat()})
                    print("Model loaded into memory.")
                except Exception as e:
                    print(f"Failed to load model {latest}: {e}")
        else:
            print(f"Model directory does not exist: {model_dir}")
        if current_model is None:
            print("No model loaded at startup. Please load a model into Config.MODEL_PATH or use the /api/model/load endpoint.")
        # Load processed training features to compute medians for missing inputs
        try:
            processed_x_path = os.path.join(Config.PROCESSED_PATH, 'X_train.pkl')
            if os.path.exists(processed_x_path):
                X_train_sample = load_pickle(processed_x_path)
                feature_columns = list(X_train_sample.columns)
                feature_medians = X_train_sample.median().to_dict()
                print(f"Loaded processed features: {len(feature_columns)} columns")
            else:
                feature_columns = None
                feature_medians = {}
                print(f"Processed X_train not found at: {processed_x_path}")
        except Exception as e:
            feature_columns = None
            feature_medians = {}
            print(f"Failed to load processed X_train for medians: {e}")
    except Exception as e:
        print(f"Error during startup model load: {e}")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

# Note: '/predict' route is registered above near prediction endpoints.
