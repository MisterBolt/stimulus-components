/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import Dialog from "../src/index"

const startStimulus = (): void => {
  const application = Application.start()
  application.register("dialog", Dialog)
}

const mockDialogElement = (): void => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
  HTMLDialogElement.prototype.getAnimations = vi.fn(() => [])
}

beforeEach(() => {
  mockDialogElement()
  document.body.innerHTML = ""
  vi.restoreAllMocks()
})

describe("connect", () => {
  it("should open the dialog when open value is true", () => {
    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog" data-dialog-open-value="true">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement

    expect(dialog.showModal).toHaveBeenCalled()
  })

  it("should not open the dialog when open value is false", () => {
    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement

    expect(dialog.showModal).not.toHaveBeenCalled()
  })
})

describe("open", () => {
  it("should set open value and show the dialog", () => {
    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement
    const controller = (document.querySelector("[data-controller='dialog']") as HTMLElement).__stimulusController

    controller.open()

    expect(controller.openValue).toBe(true)
    expect(dialog.showModal).toHaveBeenCalled()
  })
})

describe("close", () => {
  it("should set closing attribute and close dialog after animations finish", async () => {
    startStimulus()

    const finished = Promise.resolve()
    const getAnimations = vi.fn(() => [{ finished }])

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement
    dialog.getAnimations = getAnimations

    const controller = (document.querySelector("[data-controller='dialog']") as HTMLElement).__stimulusController
    controller.close()

    expect(controller.openValue).toBe(false)
    expect(dialog.getAttribute("closing")).toBe("")

    await finished

    expect(dialog.removeAttribute).toBeDefined()
    expect(dialog.close).toHaveBeenCalled()
  })
})

describe("backdropClose", () => {
  it("should close when event target is dialog", () => {
    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement
    const controller = (document.querySelector("[data-controller='dialog']") as HTMLElement).__stimulusController

    controller.backdropClose(new Event("click", { bubbles: true }))

    expect(dialog.close).not.toHaveBeenCalled()
  })
})

describe("forceClose", () => {
  it("should close the dialog", () => {
    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    const dialog = document.querySelector<HTMLDialogElement>("dialog") as HTMLDialogElement
    const controller = (document.querySelector("[data-controller='dialog']") as HTMLElement).__stimulusController

    controller.forceClose()

    expect(dialog.close).toHaveBeenCalled()
  })
})

describe("turbo:before-render", () => {
  it("should remove listener on disconnect", () => {
    const addEventListenerSpy = vi.spyOn(document, "addEventListener")
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener")

    startStimulus()

    document.body.innerHTML = `
      <div data-controller="dialog">
        <dialog data-dialog-target="dialog"></dialog>
      </div>
    `

    expect(addEventListenerSpy).toHaveBeenCalledWith("turbo:before-render", expect.any(Function))

    document.body.innerHTML = ""

    expect(removeEventListenerSpy).toHaveBeenCalledWith("turbo:before-render", expect.any(Function))
  })
})
