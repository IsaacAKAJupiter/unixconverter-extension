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

// Check if fetchFormat is set and if it is not, set to auto.
(async () => {
    let fetchFormat = await browser.storage.local.get('fetchFormat');

    if (!Object.keys(fetchFormat).length) {
        await browser.storage.local.set({ fetchFormat: 'auto' });
    }
})();

document.addEventListener('mouseup', async ev => {
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

    // Check if CTRL was held down.
    if (!ev.ctrlKey) return;

    // Get the selected text.
    let text = getSelectedText();
    // If there is no text, just return.
    if (!text) return;

    // Fetch the date.
    let { textContent, fetchedIn } = await getFormattedDate(text);
    if (!textContent || !fetchedIn) return;

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
});
