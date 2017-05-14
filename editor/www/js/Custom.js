/**
 * Created by daniel on 19.04.17.
 */

function set_background_image_on_init(editor_ui) {
    //var newValue = 'http://2.bp.blogspot.com/-KOpMIOrd4j8/UWwbINOqQwI/AAAAAAAABrg/BFQePWCrSPc/s1600/scritte+murali+ok.jpg';
    var newValue = urlParams['image']
    if (newValue != null && newValue.length > 0) {
        var img = new Image();

        img.onload = function () {
            var image = new mxImage(newValue, img.width, img.height);
            editor_ui.setBackgroundImage(image);
            var object = Object();
            object.width = image.width;
            object.height = image.height;
            editor_ui.setPageFormat(object);
            editor_ui.actions.get("fitPageWidth").funct();
        };
        img.onerror = function () {
            mxUtils.alert(mxResources.get('fileNotFound'));
        };

        img.src = newValue;
    }
}

function open_xml_on_init(editorUi) {
    var xml_file_path = urlParams['xml_file'];
    if (xml_file_path != null && xml_file_path.length > 0) {
        var splitted = xml_file_path.split('/');
        var only_name = splitted[splitted.length - 1];
        editorUi.editor.filename = only_name;
        var req = mxUtils.get(xml_file_path, mxUtils.bind(this, function (req) {
            if (req.request.status >= 200 && req.request.status <= 299) {
                if (req.request.response.length > 0) {
                    editorUi.editor.graph.model.beginUpdate();
                    try {
                        var xmlElem = mxUtils.parseXml(req.request.response).documentElement;
                        editorUi.editor.setGraphXml(xmlElem);

                    }
                    catch (e) {
                        error = e;
                        console.log(e);
                    }
                    finally {
                        editorUi.editor.graph.model.endUpdate();
                        set_background_image_on_init(editorUi);
                    }
                }
            }
        }));
    }
}

function add_autocomplete_to_input(input, url, field) {
    var url = "http://localhost:4000" + url;
    $(input).autocomplete({
        source: function (request, response) {
            $.ajax({
                url: url,
                dataType: "jsonp",
                data: {
                    term: request.term,
                    field: field
                },
                success: function (data) {
                    response(data);
                }
            });
        },
        minLength: 0,
        select: function (event, ui) {
            //alert("Selected: " + ui.item.value);
        }
    });
}

function get_token_type_of_cell(graph, cell) {
    var token_type;
    var cell_style = graph.getCellStyle(cell);
    if (cell_style.hasOwnProperty('tokenType')) {
        token_type = cell_style.tokenType;
    } else {
        token_type = '';
    }

    if (cell_style.shape === 'connector') {
        token_type = 'connector'
    }
    return token_type;
}

// create edges automatically when token fired creation event
// Two possible types
// 1) small token lays above a bigger token (-> probably a grik)
// 2) else (e.g. overlaps or token is bigger than underlying token): rasur, elision or erneuerung
// Attach this to some button because the event handler has the problem that the box doesn't have
// a state so far. So you could either wait for 1 second or fire the function manually
function generate_edges_between_overlapping_tokens(selected_cell, graph) {
    var cell = selected_cell;

    var token_type = get_token_type_of_cell(graph, cell);

    if (token_type !== undefined && token_type !== 'connector') {
        // Type 2) Selected Token is bigger than something under it
        var state = graph.getView().getState(cell);
        var found = graph.getAllCells(state.x, state.y, state.width, state.height);
        found.pop(found.indexOf(cell));
        found.forEach(function(c) {
            var tt = get_token_type_of_cell(graph, c);
            if (tt !== undefined && tt !== 'connector') {
                add_edge_between_cells(graph, cell.getParent(), c, cell, 'grak', token_type);
            }
        });
    }
}


function add_edge_between_cells(graph, parent, origin_cell, target_cell, relation_type, token_type) {
    var cell = graph.insertEdge(parent, null, '', origin_cell, target_cell, null);
    var value = graph.getModel().getValue(cell);
    // Converts the value to an XML node
	if (!mxUtils.isNode(value))
	{
		var doc = mxUtils.createXmlDocument();
		var obj = doc.createElement('object');
		obj.setAttribute('label', value || '');
		value = obj;
	}
    value.setAttribute('relation_type', relation_type);
    if (CUSTOM_PROPERTY_CHANGE_HANDLERS.hasOwnProperty('relation_type')) {
        CUSTOM_PROPERTY_CHANGE_HANDLERS['relation_type'](cell, graph.getCellStyle(cell), value, graph, 'relation_type',
            relation_type, token_type);
    }
    graph.getModel().setValue(cell, value);
}


