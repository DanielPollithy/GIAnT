TOKEN_CONFIG = {
  "tokens": {
    "symbol": {
      "properties": {
        "them_mak": ""
      }
    },
    "token": {
      "properties": {
          "ground":"",
          "tool":"",
          "lang":"",
          "dialect":"",
          "color":""
      }
    },
    "modification": {
      "properties": {
      }
    },
    "comment": {
      "properties": {
          "comment_type":"tbc"
      }
    },
    "frame": {
      "properties": {
          "frame_type":""
      }
    },
    "blanco": {
      "properties": {
      }
    },
	"connector": {
        "properties": {
            "relation_type": ""
        },
        "conditional_properties":
            {
                "relation_type": {
                    "from": "token",
                    "to": "token",
                    "value": "follows"
                }

            }

	}
  },
  "relations": {
    "follows": {
      "color": "black"
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
        }
    }
};

ALLOW_LOOPS = false;
ALLOW_DANGLING_EDGES = false;