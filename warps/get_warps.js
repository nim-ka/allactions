const fs = require("fs")

const levelsDir = "/home/nim/clean_sm64/levels/"

const levels = [
	"bbh",
	"bitdw",
	"bitfs",
	"bits",
	"bob",
	"bowser_1",
	"bowser_2",
	"bowser_3",
	"castle_courtyard",
	"castle_grounds",
	"castle_inside",
	"ccm",
	"cotmc",
	"ddd",
	"hmc",
	"jrb",
	"lll",
	"pss",
	"rr",
	"sa",
	"sl",
	"ssl",
	"thi",
	"totwc",
	"ttc",
	"ttm",
	"vcutm",
	"wdw",
	"wf",
	"wmotr"
]

const levelMacroToLevelName = {
	"LEVEL_BBH": "bbh",
	"LEVEL_BITDW": "bitdw",
	"LEVEL_BITFS": "bitfs",
	"LEVEL_BITS": "bits",
	"LEVEL_BOB": "bob",
	"LEVEL_BOWSER_1": "bowser_1",
	"LEVEL_BOWSER_2": "bowser_2",
	"LEVEL_BOWSER_3": "bowser_3",
	"LEVEL_CASTLE_COURTYARD": "castle_courtyard",
	"LEVEL_CASTLE_GROUNDS": "castle_grounds",
	"LEVEL_CASTLE": "castle_inside",
	"LEVEL_CCM": "ccm",
	"LEVEL_COTMC": "cotmc",
	"LEVEL_DDD": "ddd",
	"LEVEL_HMC": "hmc",
	"LEVEL_JRB": "jrb",
	"LEVEL_LLL": "lll",
	"LEVEL_PSS": "pss",
	"LEVEL_RR": "rr",
	"LEVEL_SA": "sa",
	"LEVEL_SL": "sl",
	"LEVEL_SSL": "ssl",
	"LEVEL_THI": "thi",
	"LEVEL_TOTWC": "totwc",
	"LEVEL_TTC": "ttc",
	"LEVEL_TTM": "ttm",
	"LEVEL_VCUTM": "vcutm",
	"LEVEL_WDW": "wdw",
	"LEVEL_WF": "wf",
	"LEVEL_WMOTR": "wmotr"
}

const warpBhvs = [
	"bhvDoorWarp",                "bhvStar",                   "bhvExitPodiumWarp",          "bhvWarp",
	"bhvWarpPipe",                "bhvFadingWarp",             "bhvInstantActiveWarp",       "bhvAirborneWarp",
	"bhvHardAirKnockBackWarp",    "bhvSpinAirborneCircleWarp", "bhvDeathWarp",               "bhvSpinAirborneWarp",
	"bhvFlyingWarp",              "bhvSwimmingWarp",           "bhvPaintingStarCollectWarp", "bhvPaintingDeathWarp",
	"bhvAirborneStarCollectWarp", "bhvAirborneDeathWarp",      "bhvLaunchStarCollectWarp",   "bhvLaunchDeathWarp"]

const bhvToAction = {
	"bhvDoorWarp": "ACT_WARP_DOOR_SPAWN",
	"bhvStar": "ACT_IDLE",
	"bhvExitPodiumWarp": "ACT_EMERGE_FROM_PIPE",
	"bhvWarp": "ACT_EMERGE_FROM_PIPE",
	"bhvWarpPipe": "ACT_EMERGE_FROM_PIPE",
	"bhvFadingWarp": "ACT_TELEPORT_FADE_IN",
	"bhvInstantActiveWarp": "ACT_IDLE",
	"bhvAirborneWarp": "ACT_SPAWN_NO_SPIN_AIRBORNE",
	"bhvHardAirKnockBackWarp": "ACT_HARD_BACKWARD_AIR_KB",
	"bhvSpinAirborneCircleWarp": "ACT_SPAWN_SPIN_AIRBORNE",
	"bhvDeathWarp": "ACT_FALLING_DEATH_EXIT",
	"bhvSpinAirborneWarp": "ACT_SPAWN_SPIN_AIRBORNE",
	"bhvFlyingWarp": "ACT_FLYING",
	"bhvSwimmingWarp": "ACT_WATER_IDLE",
	"bhvPaintingStarCollectWarp": "ACT_EXIT_AIRBORNE",
	"bhvPaintingDeathWarp": "ACT_DEATH_EXIT",
	"bhvAirborneStarCollectWarp": "ACT_FALLING_EXIT_AIRBORNE",
	"bhvAirborneDeathWarp": "ACT_UNUSED_DEATH_EXIT",
	"bhvLaunchStarCollectWarp": "ACT_SPECIAL_EXIT_AIRBORNE",
	"bhvLaunchDeathWarp": "ACT_SPECIAL_DEATH_EXIT"
}

let warpObjects = {}
let warpNodes = {}

for (let levelName of levels) {
	let scriptFile = `${levelsDir}${levelName}/script.c`

	let scripts = parse(levelName, fs.readFileSync(scriptFile, "utf8"))
	let area = null

	for (let line of scripts[`level_${levelName}_entry`]) {
		let [command, params] = line

		if (command == "AREA") {
			area = +params[0]
		}

		if (command == "END_AREA") {
			area = null
		}

		if (!area) {
			continue
		}

		if (command == "JUMP_LINK" && scripts[params[0]]) {
			for (let line2 of scripts[params[0]]) {
				line2.push(area)
			}
		}

		line.push(area)
	}

	for (let scriptName in scripts) {
		for (let [command, params, area] of scripts[scriptName]) {
			let bhv = params[params.length - 1]
			if (warpBhvs.includes(bhv)) {
				let id = params[params.length - 2].slice(4, 6)
				let warpId = `${levelName}-${area}:${id}`
				warpObjects[warpId] = bhv
			}

			if (command.endsWith("WARP_NODE")) {
				let [id, destLevel, destArea, destNode] = params
				let srcWarpId = `${levelName}-${area}:${id.replace("0x", "")}`
				let destWarpId = `${levelMacroToLevelName[destLevel]}-${+destArea}:${destNode.replace("0x", "")}`
				warpNodes[srcWarpId] = destWarpId
			}
		}
	}
}

let actions = {}

for (let src in warpNodes) {
	let dest = warpNodes[src]

	if (src == dest) {
		continue
	}

	let bhv = warpObjects[dest] ?? "bhvDoorWarp" // door warps (castle, ccm) are special objects and not caught by this tool

	let action = bhvToAction[bhv]
	actions[action] ??= []

	actions[action].push(`${src} => ${dest}`)
}

for (let action in actions) {
	console.log(`\n${action}:`)

	for (let transition of actions[action]) {
		console.log(`\t${transition}`)
	}
}

function parse(name, src) {
	let scripts = {}
	let curScript

	for (let line of src.split("\n")) {
		curScript = line.match(/(\w+)\[\]/)?.[1] ?? curScript

		line = line.replace(/\s|\/\*.+?\*\//g, "")
		if (!line.endsWith("),")) {
			continue
		}

		let [_, command, params] = line.match(/^(.+)\((.*)\),$/)

		scripts[curScript] ??= []
		scripts[curScript].push([command, params.split(",")])
	}

	return scripts
}
