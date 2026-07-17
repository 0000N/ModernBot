class ModernMenu {
    constructor(tabs) {
        this.tabs = tabs;
        this.activeTab = tabs[0]?.id;
        this.addIcon();
    }

    addIcon() {
        const $btn = $('<div class="circle_button modern_bot_settings"></div>');
        const $icon = $('<div style="width:27px;height:27px;background:url(https://raw.githubusercontent.com/0000N/ModernBot/main/img/gear.png) no-repeat 6px 5px" id="modern_settings" class="icon js-caption"></div>');
        $btn.append($icon);
        $btn.click(() => this.toggle());
        $('.gods_area_buttons').append($btn);
    }

    toggle() {
        if ($('#modern_panel').length) {
            $('#modern_panel').remove();
            return;
        }
        this.build();
    }

    build() {
        const $panel = $('<div id="modern_panel"></div>');
        const $sidebar = $('<div id="modern_sidebar"></div>');
        const $content = $('<div id="modern_content"></div>');

        this.tabs.forEach(t => {
            const $item = $('<div class="modern-tab"></div>');
            $item.text(t.title);
            if (t.id === this.activeTab) $item.addClass('active');
            $item.click(() => {
                this.activeTab = t.id;
                $('#modern_sidebar .modern-tab').removeClass('active');
                $item.addClass('active');
                this.render();
            });
            $sidebar.append($item);
        });

        $panel.append($sidebar, $content);
        $('body').append($panel);
        this.render();
    }

    render() {
        const tab = this.tabs.find(t => t.id === this.activeTab);
        if (tab) {
            const $content = $('#modern_content');
            $content.empty().append(tab.render());
        }
    }

    reRender() {
        if ($('#modern_panel').length) {
            this.render();
        }
    }
}
