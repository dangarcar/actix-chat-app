/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.tsx"
    ],
    theme: {
        extend: {
            boxShadow: {
                'glow-3': '0 0 12px #CCCCCC',
                'glow-2': '0 0 8px #CCCCCC',
                'glow-1': '0 0 4px #CCCCCC',
            }
        },
    },
    plugins: [],
}

