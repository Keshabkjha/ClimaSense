# ClimaSense

Welcome to the ClimaSense! This is a simple and intuitive web application that provides real-time weather information based on your current location or any manually searched location. The app is built using HTML, CSS, JavaScript, Python (for chatbot functionality), and the OpenWeatherMap API.

## Features

- **Automatic Location Detection:** The app requests access to your current location and automatically displays the weather information for that location.
- **Manual Search:** If you want to check the weather for a different location, simply enter the city name in the search bar.
- **Real-Time Data:** The app fetches up-to-date weather data from the OpenWeatherMap API, ensuring you get the latest information.
- **Chatbot:** The app includes SkyScope AI, a modern React + Gemini weather assistant located in `weatherbot/`, for conversational forecasts and insights.

## Live Demo

Check out the live version of the app [here](https://keshabkjha.github.io/ClimaSense/).

## Installation

To run this project locally:

1. Clone the repository:
    ```bash
    git clone https://github.com/Keshabkjha/ClimaSense.git
    ```
2. Navigate to the project directory:
    ```bash
    cd ClimaSense
    ```
3. Open `index.html` in your web browser.
4. To run the SkyScope AI chatbot:
    - Install the required Node.js packages:
      ```bash
      cd weatherbot
      npm install
      ```
    - Set the `GEMINI_API_KEY` in `weatherbot/.env.local`.
    - Start the chatbot:
      ```bash
      npm run dev
      ```
    - (Optional) The legacy Streamlit bot is still available in `weather/`.

## Usage

- **Automatic Weather Display:** Upon opening the app, it will ask for permission to access your location. Once granted, it will automatically display the current weather information for your location.
- **Manual Weather Search:** Enter the name of any city in the search bar to retrieve the weather details for that location.
- **SkyScope AI:** You can ask weather-related questions for different cities, and it will provide conversational insights and forecasts.

## Technologies Used

- **HTML:** For structuring the app's content.
- **CSS:** For styling the user interface.
- **JavaScript:** For handling user interactions and making API requests.
- **React & TypeScript:** For building SkyScope AI in `weatherbot/`.
- **Gemini API:** For AI-powered weather responses.
- **Python (Streamlit & SpaCy):** For the legacy Weather Bot.
- **OpenWeatherMap API:** For fetching real-time weather data.

## Terms of Use

If you use or modify this project, **you must provide proper credit** to the original developer, Keshab Kumar. You can do this by including a link to this repository and mentioning my name in any derived works, documentation, or presentations.

## Contributing

If you have suggestions for improving this app or want to contribute, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Keshabkjha/ClimaSense/tree/main?tab=MIT-1-ov-file) file for details.

## Acknowledgments

- Special thanks to [OpenWeatherMap](https://openweathermap.org/) for providing the API used in this app.

## Connect with Me

For more projects and information, check out my [Linktree](https://linktr.ee/Keshabkjha).

---

Developed by [Keshab Kumar](https://github.com/Keshabkjha).
