document.addEventListener("DOMContentLoaded", () => {
    // Check if block editor exists before running the script
    if (typeof wp !== "undefined" && wp.data && wp.data.select('core/edit-post')) {
        let previousTab = ''; // Store the last active tab
        let wasInserterOpen = false; // Track if inserter was previously open

        // Detect all wp_editor instances inside the block editor
        let editors = document.querySelectorAll('.wp-editor-container');
        let editorIDs = [];

        editors.forEach(editor => {
            let textarea = editor.querySelector('textarea');
            if (textarea) {
                editorIDs.push(textarea.id); // Store the ID of the text area
            }
        });

        function removeWpEditor(editorID) {
            if (!editorID) return;

            if (typeof tinyMCE !== 'undefined' && tinyMCE.get(editorID)) {
                tinyMCE.remove(tinyMCE.get(editorID));
            }

            if (typeof QTags !== 'undefined' && QTags.instances[editorID]) {
                delete QTags.instances[editorID];
            }

            if (typeof wp.editor !== 'undefined' && wp.editor.remove) {
                wp.editor.remove(editorID);
            }

            jQuery(`#${editorID}-wrap`).remove();
            jQuery(`#${editorID}`).show();
        }

        function reinitializeWpEditor(editorID) {
            if (!editorID) return;

            setTimeout(() => {
                removeWpEditor(editorID);

                wp.editor.initialize(editorID, {
                    tinymce: {
                        wpautop: true,
                        toolbar1: 'formatselect | bold italic underline | bullist numlist blockquote | alignleft aligncenter alignright | link unlink | wp_more | spellchecker | fullscreen | wp_adv',
                        toolbar2: 'strikethrough forecolor backcolor | pastetext removeformat | charmap | undo redo',
                        plugins: 'wordpress, fullscreen, link, lists, textcolor, wpautoresize, wpeditimage, wpemoji, wpgallery, wplink, wpview',
                        menubar: false,
                        setup: function (editor) {
                            editor.on('change', function () {
                                tinymce.triggerSave();
                            });
                        },
                    },
                    quicktags: true,
                    mediaButtons: true
                });
            }, 500);
        }

        function checkInserterState() {
            const isInserterOpened = wp.data.select('core/edit-post').isInserterOpened();
            const activeTab = document.querySelector('.block-editor-tabbed-sidebar__tab[aria-selected="true"]')?.textContent;

            if (!isInserterOpened && wasInserterOpen) {
                editorIDs.forEach(reinitializeWpEditor);
            }

            if (isInserterOpened &&
                (activeTab === 'Patterns' || activeTab === 'Media' || (activeTab === 'Blocks' && (previousTab === 'Patterns' || previousTab === 'Media'))) &&
                activeTab !== previousTab) {
                editorIDs.forEach(reinitializeWpEditor);
            }

            previousTab = activeTab;
            wasInserterOpen = isInserterOpened;
        }

        document.addEventListener('click', checkInserterState);

        wp.domReady(function () {
            function waitForTinyMCE(callback) {
                if (typeof wp.editor !== "undefined" && editorIDs.some(id => tinyMCE?.get(id))) {
                    callback();
                } else {
                    setTimeout(() => waitForTinyMCE(callback), 400);
                }
            }

            waitForTinyMCE(() => {
                editorIDs.forEach(reinitializeWpEditor);
            });
        });
    }
});
