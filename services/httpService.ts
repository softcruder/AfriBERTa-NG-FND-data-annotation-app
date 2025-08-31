import axios from "axios"

const requestService = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

export default requestService
