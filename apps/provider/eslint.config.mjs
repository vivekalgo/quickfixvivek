import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
    ...nextVitals,
    {
        ignores: ['.next/**', 'out/**', 'build/**', 'dist/**', 'node_modules/**'],
        rules: {
            'import/no-anonymous-default-export': 'off',
            'react-hooks/set-state-in-effect': 'off',
        },
    },
]

export default config
