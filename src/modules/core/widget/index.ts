// Widget system — unified barrel
// Components
export { SortableWidgetItem } from './components/SortableWidgetItem'
export { WidgetRefreshButton, WidgetRefreshingIndicator } from './components/WidgetControls'
export { WidgetConfigurator } from './components/WidgetConfigurator'
export { WidgetGrid } from './components/WidgetGrid'
export { WidgetRenderer } from './components/WidgetRenderer'

// Config / state
export {
  useWidgetConfig,
  type EnrichedWidget,
  type UseWidgetConfigReturn,
} from './config/widget-config'
export { WidgetEditModeProvider, useWidgetEditMode } from './config/widget-edit-mode'

// Registry
export {
  getRegisteredWidgets,
  getWidgetById,
  type ResolvedWidget,
} from './registry/widget-registry'
