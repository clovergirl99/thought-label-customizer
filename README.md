# Thought Label Customizer

An independent, unofficial extension compatible with Lumiverse.

## Install from GitHub

In Lumiverse, open Extensions, choose Add Extension, and paste:

https://github.com/clovergirl99/thought-label-customizer

Install and enable the extension. Grant its requested permissions if prompted.

The checked-in frontend.js is the original compiled extension, unchanged. spindle.json points to it directly, so no build step is needed. The original ZIP is included with the original documentation and any available source files and tests.

---

# Thought Label Customizer

A small Lumiverse Spindle extension that changes the wording on chat reasoning blocks.

It supports all three native states:

- `Thinking`
- `Thinking for 4s`
- `Thought for 12s`

The duration is preserved. Only the active and completed words are replaced.

## Settings

Open Lumiverse's Extensions panel, find **Thought Label Customizer**, and choose **Settings**. The extension adds two fields to the normal Extensions settings area; it does not create a sidebar or settings tab.

- **While thinking** changes `Thinking` and `Thinking for …`
- **When finished** changes `Thought for …`

Blank fields restore Lumiverse's original wording.

## Install

Install `thought-label-customizer-1.0.0.zip` from Lumiverse's Spindle extension installer and enable it.
