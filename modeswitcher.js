const LIGHT_NAME = "Light"
const DARK_NAME = "Dark"
const HIGHCONTRAST_NAME = "HighContrast"
let command = figma.command;

let colors = figma.getLocalPaintStyles()
let effects = figma.getLocalEffectStyles()
let themes = {
	"Light": {
		colors: [],
		effects: []
	},
	"Dark": {
		colors: [],
		effects: []
	},
	"High Contrast": {
		colors: [],
		effects: []
	}
}

function main() {
	buildStyles("colors", colors)
	buildStyles("effects", effects)

	switch(command) {
		case "light":
			modeSwitch(LIGHT_NAME)
			break;
		case "dark":
			modeSwitch(DARK_NAME)
			break;
		case "highcontrast":
			modeSwitch(HIGHCONTRAST_NAME)
			break;
		default:
			modeSwitch()
			break;
	}

  figma.closePlugin()
}

main()

function buildStyles(styleName, figmaStyles) {
	// build a list of all colors and their inverse
	let styles = figmaStyles

	styles.map(function(style) {
		let name = style.name

		let splitName = getSplitNameOfStyle(name)
		if (splitName != undefined) {
			let styleHash = {
				"name": splitName[1],
				"id": style.id
			}

			switch(splitName[0]) {
				case LIGHT_NAME:
					themes[LIGHT_NAME][styleName].push(styleHash)
					break;
				case DARK_NAME:
					themes[DARK_NAME][styleName].push(styleHash)
					break;
				case HIGHCONTRAST_NAME:
					themes[HIGHCONTRAST_NAME][styleName].push(styleHash)
					break;
				default:
					break;
			}
		}
	})
}

function getSplitNameOfStyle(name) {
	if (!name.includes("/")) {
		// name isn't nested, no splitting
		return undefined
	}

	let firstHalfOfName = name.substring(0, name.indexOf('/')).trim()
	let lastHalfOfName = name.substring(name.indexOf('/') + 1).trim()
	return [firstHalfOfName, lastHalfOfName]
}

function modeSwitch(variant = null) {
	let selection = figma.currentPage.selection

	if (selection.length == 0) {
		return;
	}

	for (var i = 0; i < selection.length; i++) {
		applyInverseColor(selection[i], variant)
		allDescendants(selection[i], variant)

		if (selection[i].type != "INSTANCE" && !find_parent_instance(selection[i].parent)) {
			selection[i].setRelaunchData({ dark: '' })
		}
	}
}

function applyInverseColor(node, variant = null) {
	let nodeStyleProperties = getNodeStyleProperties(node)

	nodeStyleProperties.map(function(property) {
		let styleProperty = null
		let colorOrEffect = "colors" // different treatment for effects

		switch(property) {
			case "backgroundStyleId":
				styleProperty = node.backgroundStyleId
				break;
			case "fillStyleId":
				styleProperty = node.fillStyleId
				break;
			case "effectStyleId":
				styleProperty = node.effectStyleId
				colorOrEffect = "effects"
				break;
			case "strokeStyleId":
				styleProperty = node.strokeStyleId
				break;
			default:
				return;
		}

		let styleId = styleProperty

		if (styleId) {
			// find color by id
			let style, styleName, splitName

			style = figma.getStyleById(styleId)

			if (style.remote) {
				figma.notify("Styles from external libraries are currently unsupported")
			}

			styleName = style.name
			splitName = getSplitNameOfStyle(styleName)

			if (splitName != undefined) {
				let inverseName;
				if (variant == null) {
					let mode = splitName[0] // "Light", "Dark", or "HighContrast"
					if (inverseName = mode == LIGHT_NAME) {
						return inverseName = mode == LIGHT_NAME
					}
					else if (inverseName = mode == DARK_NAME){
						return inverseName = mode == DARK_NAME
					}
					else {
						return inverseName = mode == HIGHCONTRAST_NAME
					}
				} else {
					inverseName = variant
				}

				let inverseColor = themes[inverseName][colorOrEffect].find(s => s.name == splitName[1])

				if (inverseColor) {
					// inverse was found
					if (property == "fillStyleId") {
						node.fillStyleId = inverseColor.id
					}

					if (property == "backgroundStyleId") {
						node.backgroundStyleId = inverseColor.id
					}

					if (property == "effectStyleId") {
						node.effectStyleId = inverseColor.id
					}

					if (property == "strokeStyleId") {
						node.strokeStyleId = inverseColor.id
					}
				}
			}
		}
	})
}

function getNodeStyleProperties(node) {
	let styleProperties = []

	if ("fillStyleId" in node) {
		styleProperties.push("fillStyleId")
	}

	if ("backgroundStyleId" in node) {
		styleProperties.push("backgroundStyleId")
	}

	if ("effectStyleId" in node) {
		styleProperties.push("effectStyleId")
	}

	if ("strokeStyleId" in node) {
		styleProperties.push("strokeStyleId")
	}

	return styleProperties
}

function allDescendants(node, variant = null) {
  // iterate all children
  if ("children" in node) {
    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];
      // console.log(child)
      applyInverseColor(child, variant)
      allDescendants(child, variant);
    }
  }
}

function find_parent_instance(node) {
    if(node.type == "INSTANCE") {
      return true
    }
    if(node.parent != null) {
    	find_parent_instance(node.parent);
    } else {
    	return false
    }
  }
