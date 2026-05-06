"""
AI Services Module

Provides high-level AI services for the platform.
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class AIServices:
    """High-level AI services."""

    def __init__(self):
        self.services = {}

    def get_service(self, service_name: str) -> Optional[Any]:
        """Get a specific AI service."""
        return self.services.get(service_name)

    def register_service(self, service_name: str, service_instance: Any):
        """Register an AI service."""
        self.services[service_name] = service_instance
        logger.info(f"Registered service: {service_name}")

    def unregister_service(self, service_name: str):
        """Unregister an AI service."""
        if service_name in self.services:
            del self.services[service_name]
            logger.info(f"Unregistered service: {service_name}")

    def list_services(self) -> list:
        """List available services."""
        return list(self.services.keys())

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all services."""
        health_status = {}
        for name, service in self.services.items():
            try:
                # Assume services have a health_check method
                health_status[name] = service.health_check()
            except AttributeError:
                health_status[name] = "unknown"

        return {
            "overall_status": "healthy" if all(status == "healthy" for status in health_status.values()) else "degraded",
            "services": health_status
        }