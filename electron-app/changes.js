var git = require("simple-git");
const d3 = require("d3");
const langDetector = require('language-detect');
const langMapper = require('language-map');

vizStatus("")

/**
 * Get the status of a git repo, and visualize the change set
 * @param {} repo_path empty means the current working directory
 */
function vizStatus(repo_path) {
	git = git(repo_path)
	var repo_path = getParentDir(git._baseDir);
	git.status(async (err, status) => {
		try {
			if (err) throw err;
			let data = await formatStatus(repo_path, status);
			draw(data);
			// get the latest commit hash (uncessary since we can use HEAD instead)
			// git.log((err, res) => {
			// });
		} catch (err) {
			console.log(err);
		}
	});
}

/**
 * Format the git statusinto graph data in json format
 * @param {} status
 */
async function formatStatus(repo_path, status) {
	// vertices and edges
	let data = {
		"nodes": [],
		"links": []
	};
	let nodes = new Array();
	let temp = new Array();

	temp = await formatWorkingFiles(repo_path, status.modified, 'M');
	Array.prototype.push.apply(nodes, temp);
	temp = await formatWorkingFiles(repo_path, status.not_added, 'A');
	Array.prototype.push.apply(nodes, temp);
	temp = await formatWorkingFiles(repo_path, status.conflicted, 'C');
	Array.prototype.push.apply(nodes, temp);
	temp = await formatWorkingFiles(repo_path, status.deleted, 'D');
	Array.prototype.push.apply(nodes, temp);
	temp = await formatWorkingFiles(repo_path, status.renamed, 'R');
	Array.prototype.push.apply(nodes, temp);


	data.nodes = nodes;
	return data;
}

/**
 * Format group of diff files in working dir to nodes array
 * @param {Array} file_list 
 * @param {string} operation 
 */
async function formatWorkingFiles(repo_path, file_list, operation) {
	let nodes = new Array();
	for (let path of file_list) {
		let node = await generateNode(repo_path, path, operation);
		nodes.push(node);
	}
	return nodes;
}

/**
 * Generate one single node for each file
 * @param {} repo_path 
 * @param {*} path 
 * @param {*} operation 
 */
function generateNode(repo_path, path, operation) {
	return new Promise((resolve, reject) => {
		let lang = 'unknown'; // unknown files will not be diff
		let abs_path = repo_path + path;
		langDetector(abs_path, (err, language) => {
			// suppose the path is relative to the curren folder
			if (err) {
				console.log(err);
				lang = 'plaintext';
			} else {
				lang = langMapper[language].aceMode;
			}

			let node = {
				"operation": operation,
				"type": "text", // TODO: the file type (text, binary, link, etc)
				"lang": lang,
				"name": getFileName(path),
				"path": path,
				"abs_path": abs_path // relative path
			};

			resolve(node);
		});
	})

}

/**
 * Get the file name from absolute path
 * @param {} path
 */
function getFileName(path) {
	return path.replace(/^.*[\\\/]/, '');
}

/**
 * Get the parent dir for a file/dir
 * @param {} path 
 */
function getParentDir(path) {
	return path.substring(0, path.lastIndexOf("\\") + 1);
}

/**
 * Visualize the change set at file level
 * @param {} data
 */
function draw(data) {
	var w = 500,
		h = 500,
		count = 10,
		fill = d3.scale.category10(),
		rec_w = 100,
		rec_h = 30;
	// nodes = d3.range(count).map(Object);
	nodes = data.nodes;

	var groupPath = function (d) {
		return "M" +
			d3.geom.hull(d.map(function (e) {
				return [e.x, e.y];
			}))
			.join("L") +
			"Z";
	};

	var groups = [];
	groups.init = function () {
		groups.a = Math.min(w, h);
		groups.r = groups.a * 0.20;
		for (i = 0; i < 4; i++) {
			var g = [];
			g.groupId = i;
			g.x = w / 2;
			g.y = h / 2;
			var k = 0.25 * groups.a;
			g.x += i & 2 ? k : -k;
			g.y += i & 1 ? k : -k;

			for (j = 0; j < 5; j++) {
				var alpha = (2 * Math.PI * j / 5);
				50
				var dummy = {
					x: g.x + 10 * Math.sin(alpha),
					y: g.y + 10 * Math.cos(alpha)
				};
				g.push(dummy);
			}
			groups[i] = g;
		};
	}


	groups.snap = function (d) {

		function change(d, to) {
			if (d.groupId != null) {
				var oldGroup = groups[d.groupId];
				var index = oldGroup.indexOf(d);
				if (index >= 0) {
					oldGroup.splice(index, 1);
				}
			}

			if (to == null) {
				d.groupId = null;
			} else {
				d.groupId = to.groupId;
				to.push(d);
			}
		}

		groups.forEach(function (g) {
			var distance = Math.sqrt(Math.pow(d.x - g.x, 2) + Math.pow(d.y - g.y, 2));
			if (distance < groups.r) {
				if (d.groupId != g.groupId) {
					change(d, g);
				}
			} else {
				if (d.groupId == g.groupId) {
					change(d, null)
				}
			}
		});
	}

	groups.delta = function (d) {

		function massCenter(g) {
			var x = 0,
				y = 0;
			g.forEach(function (e) {
				x += e.x;
				y += e.y;
			});
			return {
				x: x / g.length,
				y: y / g.length
			};
		}

		if (d.groupId == null) return 0;
		var g = groups[d.groupId];
		var massCenter = massCenter(g);
		var delta = {
			x: g.x - massCenter.x,
			y: g.y - massCenter.y
		}
		return delta;
	}

	groups.init();


	var nodeFill = function (n) {
		return n.groupId != null ? fill(n.groupId) : "lightgray";
	};

	var svg = d3.select("#chart").append("svg")
		.attr("width", w)
		.attr("height", h);


	var force = d3.layout.force()
		.nodes(nodes)
		.links([])
		.size([w, h])
		.start();

	var node = svg.selectAll("g.node")
		.data(nodes)
		.enter()
		.append("g")
		.attr("class", "node")
		// .attr("transform", function(d) {
		//             return "translate(" + d.x + "," + d.y + ")";
		// })
		// .style("stroke-width", 0.5)
		.on("mousemove", groups.snap)
		.on("dblclick", (d) => {
			// get file content before and after the change
			let arg = 'HEAD:' + d.path
			if (d.operation == "A") {
				showDiff("", d.abs_path, d.lang)
			} else if (d.operation == "D") {
				// TODO 
				showDiff(d.abs_path, "", d.lang)
			} else {
				// exists at last commit
				git.show([arg], (err, res) => {
					if (err) throw err;
					originalTxt = res
					showDiff(originalTxt, d.abs_path, d.lang)
				})
			}
		}).call(force.drag);

	node.append("rect")
		.attr("width", (d) => {
			return (d.name.length + 2) * 10;
		})
		.attr("height", rec_h)
		.attr("rx", 4)
		// .attr("transform", function(d) {
		//             return "translate(" + d.x + "," + d.y + ")";
		// })
		.style("fill", nodeFill)
		.style("stroke", function (d, i) {
			return d3.rgb(nodeFill).darker(2);
		});


	node.append("text")
		.attr("dx", (d) => {
			return (d.name.length + 2) * 5;
		}).attr("dy", rec_h * 0.7)
		.style("font-size", "20px")
		.attr("text-anchor", "middle").style("fill", "black")
		.text(function (d) {
			return d.name;
		});

	svg.style("opacity", 1e-6)
		.transition()
		.duration(1000)
		.style("opacity", 1);



	var group = svg.selectAll("path")
		.data(groups)
		.attr("d", groupPath)
		.enter().insert("path", "g")
		.style("fill", nodeFill)
		.style("stroke", nodeFill)
		.style("stroke-width", 100)
		.style("stroke-linejoin", "round")
		.style("opacity", .2)

	force.on("tick", function (e) {

		nodes.forEach(function (o) {
			if (o.groupId == null) return;
			o.x += groups.delta(o).x * .3;
			o.y += groups.delta(o).y * .3;
		});

		// node.attr("x", function (d) { return d.x; })
		// .attr("y", function (d) { return d.y; })
		//     .style("fill", nodeFill);
		node.attr("transform", function (d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

		group.attr("d", groupPath);
	});
}