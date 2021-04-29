// @ts-check

/**
 * @type {import('vitepress').UserConfig}
 */
module.exports = {
  title: 'Newlogic Core',
  description: 'Moderní řešení pro tvorbu webových aplikací',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]],
  themeConfig: {
    repo: 'newlogic-digital/core',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: false,
    editLinkText: 'Suggest changes to this page',

    nav: [
      { text: 'Začínáme', link: '/zaciname/' },
      { text: 'Dokumentace', link: '/dokumentace/' },
      { text: 'Vite', link: '/vite/' },
      {
        text: 'Odkazy',
        items: [
          {
            text: 'Newlogic UI',
            link: 'https://ui.newlogic.cz'
          },
          {
            text: 'Newlogic Digital',
            link:
              'https://www.newlogic.cz'
          }
        ]
      }
    ]
  }
}
