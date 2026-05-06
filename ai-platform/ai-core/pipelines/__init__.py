"""
ML Pipeline Module

Manages machine learning pipelines for training, evaluation, and deployment.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MLPipeline:
    """Manages ML pipelines."""

    def __init__(self):
        self.active_pipelines = {}

    def execute(self, pipeline_name: str, **kwargs) -> Dict[str, Any]:
        """Execute a specific pipeline."""
        logger.info(f"Executing pipeline: {pipeline_name}")

        if pipeline_name == "training":
            from .training_pipeline import TrainingPipeline
            pipeline = TrainingPipeline()
        elif pipeline_name == "inference":
            from .inference_pipeline import InferencePipeline
            pipeline = InferencePipeline()
        elif pipeline_name == "evaluation":
            from .evaluation_pipeline import EvaluationPipeline
            pipeline = EvaluationPipeline()
        else:
            raise ValueError(f"Unknown pipeline: {pipeline_name}")

        result = pipeline.run(**kwargs)
        self.active_pipelines[pipeline_name] = result

        logger.info(f"Pipeline {pipeline_name} execution completed")
        return result

    def get_pipeline_status(self, pipeline_name: str) -> Optional[Dict[str, Any]]:
        """Get status of a pipeline."""
        return self.active_pipelines.get(pipeline_name)

    def list_pipelines(self) -> list:
        """List available pipelines."""
        return ["training", "inference", "evaluation"]