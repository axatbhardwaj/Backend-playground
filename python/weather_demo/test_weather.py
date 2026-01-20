import unittest
from weather import parse_weather_data, format_report, get_clothing_suggestion, WeatherData, WeatherError

class TestWeatherCore(unittest.TestCase):
    """
    Tests for the pure functions in the weather module.
    Follows AAA pattern: Arrange, Act, Assert.
    """

    def test_parse_valid_json(self):
        # Arrange
        raw_json = '{"name": "Berlin", "main": {"temp": 18.5}, "weather": [{"main": "Rain"}]}'
        
        # Act
        result = parse_weather_data(raw_json)
        
        # Assert
        expected = WeatherData(city="Berlin", temperature=18.5, condition="Rain")
        self.assertEqual(result, expected)

    def test_parse_invalid_json_structure(self):
        # Arrange
        # Missing 'main'
        raw_json = '{"name": "Berlin", "weather": [{"main": "Rain"}]}'
        
        # Act & Assert
        with self.assertRaises(WeatherError) as context:
            parse_weather_data(raw_json)
        
        self.assertIn("Missing 'main.temp'", str(context.exception))

    def test_parse_malformed_json(self):
        # Arrange
        raw_json = '{name: "Berlin"}' # Invalid JSON
        
        # Act & Assert
        with self.assertRaises(WeatherError):
            parse_weather_data(raw_json)

    def test_format_report(self):
        # Arrange
        weather = WeatherData(city="Paris", temperature=25.0, condition="Sunny")
        
        # Act
        report = format_report(weather)
        
        # Assert
        self.assertEqual(report, "Weather in Paris: 25.0°C, Sunny")

    def test_clothing_suggestion_cold(self):
        # Act
        suggestion = get_clothing_suggestion(5.0)
        # Assert
        self.assertEqual(suggestion, "Wear a heavy coat.")

    def test_clothing_suggestion_warm(self):
        # Act
        suggestion = get_clothing_suggestion(25.0)
        # Assert
        self.assertEqual(suggestion, "T-shirt weather!")

if __name__ == '__main__':
    unittest.main()
