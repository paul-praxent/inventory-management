import { ref, watch, nextTick } from 'vue'

// Shared focus-management + Escape-to-close behavior for modal dialogs.
// All 6 modal components share near-identical overlay/container markup, so
// this composable centralizes the a11y behavior that goes with it rather
// than duplicating the same watch/focus logic 6 times.
//
// isOpenSource: anything `watch()` accepts as a source (ref, reactive getter,
// or a `() => props.isOpen`-style function) that resolves to the modal's open state.
// closeFn: function to invoke when Escape is pressed inside the modal.
//
// Note: this moves focus into the modal on open and restores it on close
// (a minimal focus entry point), but does not implement full Tab-cycling
// containment. Given each modal here is short-lived, has a visible close
// button, and content is not deeply nested, that's judged sufficient for
// this pass — a full trap can be added later if audits call for it.
export function useModalA11y(isOpenSource, closeFn) {
  const modalRef = ref(null)
  let previouslyFocusedElement = null

  watch(isOpenSource, (isOpen) => {
    if (isOpen) {
      // Remember what had focus so it can be restored when the modal closes.
      previouslyFocusedElement = document.activeElement
      nextTick(() => {
        modalRef.value?.focus()
      })
    } else if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus()
      previouslyFocusedElement = null
    }
  })

  const handleEscape = () => {
    closeFn()
  }

  return {
    modalRef,
    handleEscape
  }
}
