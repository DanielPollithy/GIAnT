gui_finished_loading = false;

jQuery(window).load(function(){
        gui_finished_loading = true;
        jQuery('#overlay').fadeOut();
});

setTimeout(function(){
        if (!gui_finished_loading) {
                jQuery('#overlay').fadeIn();
        }
}, 1000);

$(document).ready(function() {
    $("a").click(function () {
        if (!$(this).hasClass('no-loader')) {
            $(this).addClass('loading-link');
        }
        return true;
    });

    $("button").click(function () {
        if ($(this).hasClass('spinner')) {
            $(this).append('<span class="glyphicon glyphicon-refresh spinning"></span>');
        }
        return true;
    });

    // init datatable
    $('table').DataTable({
        searching: false
    });
});