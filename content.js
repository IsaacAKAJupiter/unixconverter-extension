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

    // Check if the CTRL Conversion is even enabled.
    let ctrlConversion = await browser.storage.local.get('ctrlConversion');

    // If no CTRL key, no text, or no converted textContent/fetchedIn, return.
    if (
        !ev.ctrlKey ||
        !text ||
        !textContent ||
        !fetchedIn ||
        !ctrlConversion.ctrlConversion
    )
        return;

    // Create an element in the body.
    let div = document.createElement('div');
    // Set the ID and the top/left style based on the mouse position.
    div.id = 'unixconverter-base';
    div.style.left = `${ev.clientX}px`;
    div.style.top = `${ev.clientY + 30}px`;

    // Copy icon.
    let icon = document.createElement('i');
    icon.textContent = 'file_copy';
    icon.classList.add('material-icons', 'no-hover');
    icon.id = 'unixconverter-icon';

    // Set event listener for the icon.
    icon.addEventListener('click', _ => copyToClipboard(textContent));

    // Create the actual timestamp.
    let p = document.createElement('p');
    p.id = 'unixconverter-date';
    p.textContent = textContent;

    let fetchedInP = document.createElement('p');
    fetchedInP.id = 'unixconverter-fetched-in';
    fetchedInP.textContent = `This date was fetched using ${fetchedIn}.`;

    // The Material Icons font.
    let font = document.createElement('link');
    font.setAttribute(
        'href',
        'https://fonts.googleapis.com/icon?family=Material+Icons'
    );
    font.setAttribute('rel', 'stylesheet');

    // Append elements.
    div.appendChild(font);
    div.appendChild(icon);
    div.appendChild(p);
    div.appendChild(fetchedInP);
    document.body.appendChild(div);
}

(() => {
    loadDefaultSettings();

    // Add an event listener on mouseup to handle the CTRL click conversion.
    document.addEventListener('mouseup', handleEvent, false);
})();
