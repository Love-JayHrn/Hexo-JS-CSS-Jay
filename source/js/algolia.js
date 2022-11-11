window.addEventListener('load', () => {
    const openSearch = () => {
        document.body.style.cssText = 'width: 100%;overflow: hidden'
        document.querySelector('#algolia-search .search-dialog').style.display = 'block'
        document.querySelector('#algolia-search .ais-search-box--input').focus()
        btf.animateIn(document.getElementById('search-mask'), 'to_show 0.5s')
        // shortcut: ESC
        document.addEventListener('keydown', function f (event) {
            if (event.code === 'Escape') {
                closeSearch()
                document.removeEventListener('keydown', f)
            }
        })
    }

    const closeSearch = () => {
        document.body.style.cssText = "width: '';overflow: ''"
        const $searchDialog = document.querySelector('#algolia-search .search-dialog')
        $searchDialog.style.animation = 'search_close .5s'
        setTimeout(() => { $searchDialog.style.cssText = "display: none; animation: ''" }, 500)
        btf.animateOut(document.getElementById('search-mask'), 'to_hide 0.5s')
    }

    const searchClickFn = () => {
        document.querySelector('#search-button > .search').addEventListener('click', openSearch)
        document.getElementById('search-mask').addEventListener('click', closeSearch)
        document.querySelector('#algolia-search .search-close-button').addEventListener('click', closeSearch)
        $('#menu-search').on('click',function(){
            rm.hideRightMenu();
            openSearch();
            let t=document.getElementsByClassName('ais-search-box--input')[0];
            let evt = document.createEvent('HTMLEvents');
            evt.initEvent('input', true, true);
            t.value=selectTextNow;
            t.dispatchEvent(evt);
        });
        //响应打开搜索 shift+S
        $(window).on('keydown', function(ev)
        {
            // Escape
            if(ev.keyCode == 83 && ev.shiftKey && heo_keyboard)
            {
                if (selectTextNow) {
                    openSearch();
                    let t=document.getElementsByClassName('ais-search-box--input')[0];
                    let evt = document.createEvent('HTMLEvents');
                    evt.initEvent('input', true, true);
                    t.value=selectTextNow;
                    t.dispatchEvent(evt);
                }else {
                    openSearch();
                }

                return false;
            }
        });
    }

    searchClickFn()

    window.addEventListener('pjax:complete', function () {
        getComputedStyle(document.querySelector('#algolia-search .search-dialog')).display === 'block' && closeSearch()
        searchClickFn()
    })

    const algolia = GLOBAL_CONFIG.algolia
    const isAlgoliaValid = algolia.appId && algolia.apiKey && algolia.indexName
    if (!isAlgoliaValid) {
        return console.error('Algolia setting is invalid!')
    }

    const search = instantsearch({
        appId: algolia.appId,
        apiKey: algolia.apiKey,
        indexName: algolia.indexName,
        searchParameters: {
            hitsPerPage: algolia.hits.per_page || 10
        },
        searchFunction: function (helper) {
            const searchInput = document.querySelector('#algolia-search-input input')

            if (searchInput.value) {
                let innerLoading = '<div class="fa fa-spinner fa-spin"></div>';
                document.getElementById("algolia-hits").innerHTML=innerLoading;
                helper.search();
            }
        }
    })

    search.addWidget(
        instantsearch.widgets.searchBox({
            container: '#algolia-search-input',
            reset: false,
            magnifier: false,
            placeholder: GLOBAL_CONFIG.algolia.languages.input_placeholder
        })
    )
    search.addWidget(
        instantsearch.widgets.hits({
            container: '#algolia-hits',
            templates: {
                item: function (data) {
                    const link = data.permalink ? data.permalink : (GLOBAL_CONFIG.root + data.path)
                    return (
                        '<a href="' + link + '" class="algolia-hit-item-link">' +
                        data._highlightResult.title.value +
                        '</a>'
                    )
                },
                empty: function (data) {
                    return (
                        '<div id="algolia-hits-empty">' +
                        GLOBAL_CONFIG.algolia.languages.hits_empty.replace(/\$\{query}/, data.query) +
                        '</div>'
                    )
                }
            },
            cssClasses: {
                item: 'algolia-hit-item'
            }
        })
    )

    search.addWidget(
        instantsearch.widgets.stats({
            container: '#algolia-stats',
            templates: {
                body: function (data) {
                    const stats = GLOBAL_CONFIG.algolia.languages.hits_stats
                        .replace(/\$\{hits}/, data.nbHits)
                        .replace(/\$\{time}/, data.processingTimeMS)
                    return (
                        '<hr>' +
                        stats +
                        '<span class="algolia-logo pull-right">' +
                        // '  <img src="' + GLOBAL_CONFIG.root + 'img/algolia.svg" alt="Algolia" />' +
                        '</span>'
                    )
                }
            }
        })
    )

    search.addWidget(
        instantsearch.widgets.pagination({
            container: '#algolia-pagination',
            scrollTo: false,
            showFirstLast: false,
            labels: {
                first: '<i class="fas fa-angle-double-left"></i>',
                last: '<i class="fas fa-angle-double-right"></i>',
                previous: '<i class="fas fa-angle-left"></i>',
                next: '<i class="fas fa-angle-right"></i>'
            },
            cssClasses: {
                root: 'pagination',
                item: 'pagination-item',
                link: 'page-number',
                active: 'current',
                disabled: 'disabled-item'
            }
        })
    )
    search.start()

    window.pjax && search.on('render', () => {
        window.pjax.refresh(document.getElementById('algolia-hits'))
    })
})