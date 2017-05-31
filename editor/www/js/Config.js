
EDITOR_CONFIG = {
    "default_font_size": "40pt"

};

TOKEN_CONFIG = {
  "tokens": {
    "symbol": {
      "color": "orange",
      "properties": [
          "them_mak"
	  ]
    },
    "token": {
      "color": "grey",
      "properties": [
        "pos",
        "tool",
        "lang",
        "dialect",
        "color"
      ]
    },
    "erasure": {
      "color": "red",
      "properties": []
    },
	"connector": {
        "properties": [
            "relation_type"
		]
	}
  },
  "relations": {
    "follow": {
      "color": "grey"
    },
    "add+": {
      "color": "green"
    },
    "add-": {
      "color": "red"
    },
    "com+": {
      "color": "green"
    },
    "com-": {
      "color": "red"
    },
    "rasur": {
      "color": "black"
    },
    "elision": {
      "color": "black"
    },
    "grik": {
      "color": "orange"
    },
    "grak": {
      "color": "pink"
    }
  }
};

CUSTOM_PROPERTY_CHANGE_HANDLERS = {
    'relation_type': function (cell, cell_style, cell_content, graph, property, property_value, token_type) {
        if (TOKEN_CONFIG.relations.hasOwnProperty(property_value)) {
            graph.setCellStyles('strokeColor', TOKEN_CONFIG.relations[property_value].color, [cell]);
            graph.setCellStyles('strokeWidth', '2', [cell]);
        }
    }
};

ALLOW_LOOPS = false;
ALLOW_DANGLING_EDGES = false;