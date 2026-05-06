"""
Model Training Module

Handles the training of machine learning models for the AI Core.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ModelTrainer:
    """Handles model training operations."""

    def __init__(self):
        self.trained_models = {}

    def train(self, model_name: str, **kwargs) -> Dict[str, Any]:
        """Train a specific model."""
        logger.info(f"Starting training for model: {model_name}")

        # Import specific training modules based on model type
        if model_name == "diagnostic":
            from .diagnostic_training import DiagnosticTrainer
            trainer = DiagnosticTrainer()
        elif model_name == "pricing":
            from .pricing_training import PricingTrainer
            trainer = PricingTrainer()
        else:
            from .general_training import GeneralTrainer
            trainer = GeneralTrainer()

        result = trainer.train(**kwargs)
        self.trained_models[model_name] = result

        logger.info(f"Training completed for model: {model_name}")
        return result

    def get_trained_models(self) -> Dict[str, Any]:
        """Get list of trained models."""
        return self.trained_models