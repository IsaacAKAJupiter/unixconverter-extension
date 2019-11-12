function getSelectedText() {
    // Try window.getSelection. If not found use document.selection.
    if (window.getSelection) {
        var activeElement = document.activeElement;
        if (activeElement && activeElement.value) {
            return activeElement.value
                .substring(
                    activeElement.selectionStart,
                    activeElement.selectionEnd
                )
                .trim();
        } else {
            let selection = window.getSelection();
            if (selection) {
                return selection.toString().trim();
            }
        }

        // Check if the selection exists.
    } else if (document.selection) {
        return document.selection.createRange().text.trim();
    }

    // If neither was found, console error.
    console.error('Cannot get the selected text.');
    return '';
}

function copyToClipboard(text) {
    function oncopy(event) {
        document.removeEventListener('copy', oncopy, true);
        // Hide the event from the page to prevent tampering.
        event.stopImmediatePropagation();

        // Overwrite the clipboard content.
        event.preventDefault();
        event.clipboardData.setData('text/plain', text);
    }
    document.addEventListener('copy', oncopy, true);

    // Execute the copy command.
    document.execCommand('copy');
}

async function handleEvent(ev) {
    // Get the text and the formatted date.
    let text = getSelectedText();

    // Fetch the date.
    let { textContent, fetchedIn } = await getFormattedDate(text);

    //
    // Send the new selection text to the context menu.
    //

    // If it is not left click, return.
    if (ev.button !== 0) return;

    // Get the context menu local storage and check if context menu is enabled.
    let contextMenu = await browser.storage.local.get('contextMenu');

    // If there is no number selected or contextMenu is disabled, update the context menu to not be visible.
    if (!textContent || !fetchedIn || !contextMenu.contextMenu) {
        await browser.runtime.sendMessage({
            type: 'updateContextMenu',
            update: { visible: false }
        });
    } else {
        // Send a message to the background script to update the context menu.
        await browser.runtime.sendMessage({
            type: 'updateContextMenu',
            update: {
                title: `Result (from ${fetchedIn}): ${textContent}`,
                visible: true
            }
        });
    }

    //
    // Check to see if I should display the div on the screen showing converted time.
    //

    // Get the base div.
    let baseDiv = document.getElementById('unixconverter-base');

    // If the base div exists, do not allow more conversions.
    if (baseDiv) {
        // Check if target was not the base or the date and if neither, remove the base div.
        if (
            ev.target.id !== 'unixconverter-base' &&
            ev.target.id !== 'unixconverter-date'
        ) {
            baseDiv.remove();
        }

        return;
    }

    // If no CTRL key, no text, or no converted textContent/fetchedIn, return.
    if (!ev.ctrlKey || !text || !textContent || !fetchedIn) return;

    // Create an element in the body.
    let div = document.createElement('div');
    // Set the ID and the top/left style based on the mouse position.
    div.id = 'unixconverter-base';
    div.style.left = `${ev.clientX}px`;
    div.style.top = `${ev.clientY + 30}px`;

    // Create the actual timestamp.
    let p = document.createElement('p');
    p.id = 'unixconverter-date';
    p.textContent = textContent;

    let fetchedInP = document.createElement('p');
    fetchedInP.id = 'unixconverter-fetched-in';
    fetchedInP.textContent = `This date was fetched using ${fetchedIn}.`;

    // Append elements.
    div.appendChild(p);
    div.appendChild(fetchedInP);
    document.body.appendChild(div);
}

// Make an async function that calls itself immediately as the content script loads.
(async () => {
    // Check if fetchFormat is set and if it is not, set to auto.
    let fetchFormat = await browser.storage.local.get('fetchFormat');

    if (!Object.keys(fetchFormat).length) {
        await browser.storage.local.set({ fetchFormat: 'auto' });
    }

    // Check if contextMenu is set and if it is not, set to false.
    let contextMenu = await browser.storage.local.get('contextMenu');

    if (!Object.keys(contextMenu).length) {
        await browser.storage.local.set({ contextMenu: false });
    }

    // Add an event listener on mouseup to handle the CTRL click conversion.
    document.addEventListener('mouseup', handleEvent, false);
})();
