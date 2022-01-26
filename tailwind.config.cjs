const { tailwindColors, tailwindVariables } = require('./modules/tailwind/index.cjs')

module.exports = {
    content: [
        './src/**/*.{js,html,twig}'
    ],
    theme: {
        extend: {
            colors: tailwindColors([
                'background', 'default', 'invert', 'light', 'dark', 'primary', 'primary-light', 'secondary',
                'warning', 'error', 'info', 'success'
            ]),
            fontFamily: tailwindVariables('font', ['primary', 'secondary']),
            fontWeight: tailwindVariables('font', ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold']),
            zIndex: tailwindVariables('z', [10, 20, 30, 40, 50, 60], {
                0: 0,
                auto: 'auto'
            }),
            screens: {
                m: { max: '47.9375em' },
                t: '48em',
                d: '60em',
                w: '76em',
                hd: '88em',
                touch: { max: '59.9375em' }
            }
        },
    },
    plugins: [],
}
