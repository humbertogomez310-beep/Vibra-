import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

export default defineConfig({
base: "/Vibra-/",

server: {
port,
host: "0.0.0.0",
},

plugins: [react()],

resolve: {
alias: {
"@": path.resolve(__dirname, "./src"),
},
},
});
