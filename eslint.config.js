import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      // Optional props are typed as possibly undefined, so defaults are not required.
      'vue/require-default-prop': 'off',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  prettier,
)
