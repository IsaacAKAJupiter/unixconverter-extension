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

document.addEventListener('mouseup', ev => {
    let baseDiv = document.getElementById('unixconverter-base');
    if (
        baseDiv &&
        ev.target.id !== 'unixconverter-base' &&
        ev.target.id !== 'unixconverter-date'
    ) {
        baseDiv.remove();
        return;
    }

    // Check if CTRL was held down.
    if (!ev.ctrlKey) return;

    // Get the selected text.
    let text = getSelectedText();
    // If there is no text, just return.
    if (!text) return;

    // Check if you selected regex.
    if (/^[0-9]{1,}$/.test(text)) {
        let date = dayjs.unix(text).toDate();

        // Create an element in the body.
        let div = document.createElement('div');
        // Set the ID and the top/left style based on the mouse position.
        div.id = 'unixconverter-base';
        div.style.left = `${ev.clientX}px`;
        div.style.top = `${ev.clientY + 30}px`;

        // Create the actual timestamp.
        let p = document.createElement('p');
        p.id = 'unixconverter-date';
        p.innerHTML = date.toString();

        // Append elements.
        div.appendChild(p);
        document.body.appendChild(div);
    }
});
