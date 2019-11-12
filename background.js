async function createContextMenu() {
    await browser.contextMenus.removeAll();
    await browser.contextMenus.create({
        id: 'unixconverter-context',
        title: 'UC',
        contexts: ['selection'],
        visible: false
    });
}

async function handleMessage(request, sender, sendResponse) {
    switch (request.type) {
        case 'removeContextMenu':
            await browser.contextMenus.removeAll();
            break;
        case 'updateContextMenu':
            // Call the browser menus update function to update the context menu.
            browser.contextMenus
                .update('unixconverter-context', request.update)
                .catch(async e => {
                    // If there was an error in the promise, create the context menu.
                    await createContextMenu();
                });
            break;
    }
}

// Add listener to the onMessage event.
browser.runtime.onMessage.addListener(handleMessage);

// Add listener to the onInstalled event.
browser.runtime.onInstalled.addListener(createContextMenu);

// Add listener to the context menu clicked event.
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    // If no selected text, return.
    if (!info.hasOwnProperty('selectionText') || !info.selectionText) return;

    // Fetch the date.
    let { textContent, fetchedIn } = await getFormattedDate(info.selectionText);
    if (!textContent || !fetchedIn) return;

    // Execute the code on the current tab to call the copyToClipboard function.
    browser.tabs.executeScript(tab.id, {
        code: `copyToClipboard('${textContent}')`
    });
});
