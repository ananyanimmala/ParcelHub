import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json"
    }
});

API.interceptors.request.use(
    (config) => {

        const token = localStorage.getItem("token");

        console.log(
            "API Request:",
            config.method?.toUpperCase(),
            config.url
        );

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;

            console.log(
                "JWT token attached to request"
            );
        } else {
            console.warn(
                "No JWT token found in localStorage"
            );
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


API.interceptors.response.use(
    (response) => {

        console.log(
            "API Response:",
            response.status,
            response.config.url
        );

        return response;
    },

    (error) => {

        console.error(
            "API Error:",
            error.response?.status,
            error.response?.data
        );

        return Promise.reject(error);
    }
);


export default API;