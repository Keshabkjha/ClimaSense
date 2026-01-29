import streamlit as st
import plotly.express as px
from backend import get_data

# Add title, text input, slider, select box, and sub header
st.title("Weather Forecast for the Next Days")
default_place = st.query_params.get("location", "")
if isinstance(default_place, list):
    default_place = default_place[0] if default_place else ""
place = st.text_input("Place: ", value=default_place)
days = st.slider("Forecast Days", min_value=1, max_value=5,
                 help="Select the number of forecast days")
option = st.selectbox("Select data to view",
                      ("Temperature", "Sky"))
st.subheader(f"{option} for the next {days} days in {place}")

if place:
    # Get the temperature/sky data
    try:
        filtered_data = get_data(place, days)

        if option == "Temperature":
            temperatures = [dict["main"]["temp"] for dict in filtered_data]
            dates = [dict["dt_txt"] for dict in filtered_data]
            # Create a temperature plot
            figure = px.line(x=dates, y=temperatures, labels={"x": "Dates", "y": "Temperature (C)"})
            st.plotly_chart(figure)

        if option == "Sky":
            images = {
                "Clear": "images/clear.png",
                "Clouds": "images/cloud.png",
                "Rain": "images/rain.png",
                "Snow": "images/snow.png",
                "Drizzle": "images/drizzle.png",
                "Thunderstorm": "images/thunderstorm.png",
                "Mist": "images/mist.png",
                "Fog": "images/fog.png",
                "Haze": "images/haze.png",
                "Smoke": "images/smoke.png",
                "Dust": "images/dust.png",
                "Sand": "images/sand.png",
                "Ash": "images/ash.png",
                "Squall": "images/squall.png",
                "Tornado": "images/tornado.png",
            }
            sky_conditions = [dict["weather"][0]["main"] for dict in filtered_data]
            dates = [dict["dt_txt"] for dict in filtered_data]
            image_paths = [images.get(condition, "images/cloud.png") for condition in sky_conditions]
            st.image(image_paths, width=115, caption=dates)

    except KeyError:
        st.write("That place does not exist.")
