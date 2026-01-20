import json
from dataclasses import dataclass
from typing import Optional

# --- Domain Models (Immutable) ---

@dataclass(frozen=True)
class WeatherData:
    """Immutable data structure for weather info."""
    city: str
    temperature: float
    condition: str

class WeatherError(Exception):
    """Base exception for weather operations."""
    pass

# --- Pure Functions (Core Logic) ---

def parse_weather_data(raw_data: str) -> WeatherData:
    """
    Parses raw JSON string into a structured WeatherData object.
    
    Args:
        raw_data: JSON string containing OpenWeatherMap-style data.
        
    Returns:
        WeatherData object.
        
    Raises:
        WeatherError: If parsing fails or required fields are missing.
    """
    try:
        data = json.loads(raw_data)
        
        # Validation checks
        if "name" not in data:
            raise KeyError("Missing 'name' field")
        if "main" not in data or "temp" not in data["main"]:
            raise KeyError("Missing 'main.temp' field")
        if "weather" not in data or len(data["weather"]) == 0:
            raise KeyError("Missing 'weather' information")
            
        return WeatherData(
            city=data["name"],
            temperature=float(data["main"]["temp"]),
            condition=data["weather"][0]["main"]
        )
    except (json.JSONDecodeError, KeyError, IndexError, ValueError) as e:
        raise WeatherError(f"Failed to parse weather data: {str(e)}")

def format_report(weather: WeatherData) -> str:
    """
    Formats the weather data into a human-readable string.
    """
    return f"Weather in {weather.city}: {weather.temperature}°C, {weather.condition}"

def get_clothing_suggestion(temperature: float) -> str:
    """
    Pure function to suggest clothing based on temperature.
    """
    if temperature < 10:
        return "Wear a heavy coat."
    elif temperature < 20:
        return "Wear a light jacket."
    else:
        return "T-shirt weather!"

def celsius_to_fahrenheit(celsius: float) -> float:
    """Pure function to convert temperature."""
    return (celsius * 9/5) + 32

# --- Impure Functions (I/O) ---
# Separated to keep core logic testable

def fetch_weather_mock(city: str) -> str:
    """
    Simulates fetching weather data (Impure).
    """
    # In reality, this would use requests.get()
    mock_db = {
        "London": '{"name": "London", "main": {"temp": 15.5}, "weather": [{"main": "Cloudy"}]}',
        "Tokyo": '{"name": "Tokyo", "main": {"temp": 22.0}, "weather": [{"main": "Clear"}]}',
    }
    return mock_db.get(city, "{}")

def main():
    """
    Orchestrator function.
    """
    city = "London"
    try:
        raw_json = fetch_weather_mock(city)
        if raw_json == "{}":
             print(f"City {city} not found.")
             return

        weather = parse_weather_data(raw_json)
        report = format_report(weather)
        advice = get_clothing_suggestion(weather.temperature)
        
        print(report)
        print(advice)
        
    except WeatherError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
