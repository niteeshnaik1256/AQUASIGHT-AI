"""
Domain error classes and custom exceptions for AQUASIGHT AI.
"""


class AQUASIGHTError(Exception):
    """Base exception for all domain errors."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class HydrologyInputError(AQUASIGHTError):
    """Raised when hydrological input parameters violate physical constraints."""
    def __init__(self, message: str):
        super().__init__(message, status_code=422)


class ClimatologyError(AQUASIGHTError):
    """Raised when external weather data cannot be retrieved or is malformed."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message, status_code=status_code)


class MassBalanceInvariantError(AQUASIGHTError):
    """Raised when conservation of mass is violated during simulation."""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)


class ResourceNotFoundError(AQUASIGHTError):
    """Raised when an assessment or simulation ID is not found."""
    def __init__(self, message: str):
        super().__init__(message, status_code=404)
