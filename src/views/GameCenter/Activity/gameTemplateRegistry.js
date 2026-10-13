export const GAME_TEMPLATE_IDS = Object.freeze({
  SUPER_DRAW: 0,
  SLOT_MACHINE: 1
})

const SUPPORTED_TEMPLATE_IDS = Object.freeze({
  [GAME_TEMPLATE_IDS.SUPER_DRAW]: true,
  [GAME_TEMPLATE_IDS.SLOT_MACHINE]: true
})

export function resolveGameTemplateId(value) {
  const templateId = Number(value)
  return Object.prototype.hasOwnProperty.call(SUPPORTED_TEMPLATE_IDS, templateId)
    ? templateId
    : GAME_TEMPLATE_IDS.SUPER_DRAW
}
