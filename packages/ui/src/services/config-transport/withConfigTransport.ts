import { DefineComponent, ComponentOptions, h, computed, SetupContext } from 'vue'
import { PropOptions, VueConstructor } from 'vue-class-component'
import { useLocalConfig } from '../../components/vuestic-components/va-config/VaConfig'
import { useGlobalConfig, GlobalConfig } from '../GlobalConfigPlugin'
import { getLocalConfigWithComponentProp } from './createConfigValueGetter'

export type Props = {
  [key: string]: PropOptions;
}

/**
 * name that signifies config should be applied to all components
 */
const ALL_COMPONENTS = 'all'

const createConfigValueGetter = (
  globalConfig: GlobalConfig,
  configChain: GlobalConfig[],
  componentName = '',
) => (
  prop: string,
  defaultValue: any,
) => {
  // We have to pass context here as this method will be mainly used in prop default,
  // and methods are not accessible there.
  const configs = globalConfig ? [globalConfig, ...configChain] : configChain

  const componentConfig = getLocalConfigWithComponentProp(configs, componentName, prop)
  if (componentConfig) {
    return componentConfig[componentName][prop]
  }

  const allConfig = getLocalConfigWithComponentProp(configs, ALL_COMPONENTS, prop)
  if (allConfig) {
    return allConfig[ALL_COMPONENTS][prop]
  }

  return typeof defaultValue === 'function' ? defaultValue() : defaultValue
}

function getComponentOptions (component: DefineComponent): ComponentOptions {
  switch (true) {
  case Boolean(component.options):
    return component.options
  case Boolean(component.__vccOpts) || Boolean(component.__b):
    return { ...component.__b, ...component.__vccOpts }
  default:
    return component
  }
}

const withConfigTransport = (component: DefineComponent | VueConstructor): ComponentOptions<any> => {
  const options = getComponentOptions(component as DefineComponent)
  const propsOptions: { [key: string]: PropOptions } = { ...options.props }
  const methods: { [key: string]: (...args: any[]) => any } = { ...options.methods }
  const optionsWithoutDefaults = Object.keys(propsOptions)

  return {
    name: `WithConfigTransport${component.name || 'Component'}`,
    props: optionsWithoutDefaults,
    methods: Object.keys(methods).reduce((acc, name) => ({
      ...acc,
      [name]: function (...args: any[]) {
        return (this as any).$refs.innerRef[name](...args)
      },
    }), {}),
    setup (props: Record<string, any>, context: SetupContext) {
      const configChain = useLocalConfig()

      const { getGlobalConfig } = useGlobalConfig()

      const computedProps = computed(() => {
        const getConfigValue = createConfigValueGetter(getGlobalConfig ? getGlobalConfig() : {}, configChain, component.name)

        const getValue = (name: string, defaultValue: any) => {
          // We want to fallback to config in 2 cases:
          // * prop value is undefined (allows user to dynamically enter/exit config).
          // * prop value is not defined
          if (!(name in props) || (props[name] === undefined)) {
            return getConfigValue(name, defaultValue)
          }

          // In other cases we return the prop itself.
          return props[name]
        }

        return Object.entries(propsOptions).reduce((computed, [name, definition]) => ({
          ...computed,
          [name]: getValue(name, definition.default),
        }), {})
      })

      return () => h(
        component,
        {
          ...computedProps.value,
          ref: 'innerRef',
        },
        context.slots,
      )
    },
  }
}

export default withConfigTransport
