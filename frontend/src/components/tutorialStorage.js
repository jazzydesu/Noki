const TUTORIAL_KEY = 'noki-tutorial-done'

export function hasSeenTutorial() {
  try {
    return window.localStorage.getItem(TUTORIAL_KEY) === '1'
  } catch {
    return true
  }
}

export function markTutorialSeen() {
  try {
    window.localStorage.setItem(TUTORIAL_KEY, '1')
  } catch {
  }
}
