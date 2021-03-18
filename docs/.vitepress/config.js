// @ts-check

/**
 * @type {import('vitepress').UserConfig}
 */
module.exports = {
  title: 'Newlogic Core',
  description: 'Moderní řešení pro tvorbu webových aplikací',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }]],
  themeConfig: {
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
            text: 'GitLab',
            link: 'https://git.newlogic.cz/newlogic-dev/newlogic-ui'
          },
          {
            text: 'Changelog',
            link:
              'https://git.newlogic.cz/newlogic-dev/newlogic-ui/-/blob/master/CHANGELOG'
          }
        ]
      }
    ]
  }
}
