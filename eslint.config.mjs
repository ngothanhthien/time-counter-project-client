import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

const config = createConfigForNuxt({
  dirs: {
    src: ['app'],
    pages: ['app/pages'],
    layouts: ['app/layouts'],
    components: ['app/components'],
  },
})

config.append({
  ignores: ['.nuxt', 'node_modules', 'dist'],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
})

export default await config
