/**
 * Simple ToDo List application.
 * @author Bartłomiej Romanek <poczta@rombarte.pl>
 */
 var Task =
{
	id: undefined,
	content : undefined,
	is_checked : undefined,
	order_number : undefined
}

var app = 
{
	/**
	 * This method create body and prepare app.
	 * @param {string} title Application title.
	 * @param {string} language Application language according to ISO 639-1 rules.
	 */
	init : function(title, language)
	{
		app.title = title;
		app.document.setAttribute("language", language);	
		app.head.appendChild(document.createElement("title"));
		app.head.getElementsByTagName("title")[0].innerHTML = app.title;	
		app.head.appendChild(document.createElement("link"));
		app.head.getElementsByTagName("link")[0].setAttribute("href", "frontend/template/style.less");
		app.head.getElementsByTagName("link")[0].setAttribute("rel", "stylesheet/less");
	
		window.onload = function()
		{
			app.makeRequest("get", "frontend/template/index.html", null, function(data)
			{
				app.template = data.replace("{{ TITLE }}", app.title);
				document.getElementsByTagName("body")[0].innerHTML = app.template;					
				
				document.getElementsByClassName("task-new")[0].addEventListener("click", app.newItem);

				app.makeRequest("get", "backend/api/select/", null, function(data)
				{
					data = JSON.parse(data);		
					if(data.success == true)
					{
						for(var i = 0; i < Object.keys(data).length-1; i++)
						{
							var task = { id: data[i].id, content: data[i].content, is_checked: data[i].is_checked, order_number: data[i].order_number };
							app.content.push(task);
							app.createItem(task);
						}
						app.setPosition();
						window.addEventListener('resize', app.setPosition);
					}
					else
					{
						alert("Can't connect to database!");
					}		
				});
			});
		}	
	},
	
	/**
	 * This method changes content position to center of screen or 10px near window frame, if content is too big.
	 */
	setPosition : function()
	{
		var appContainer = document.getElementById("list-table");
		app.top = (window.innerHeight - appContainer.offsetHeight)/2;
		app.left = (window.innerWidth - appContainer.offsetWidth)/2;
				
		appContainer.style.top = (app.top < 10 ? 10 : app.top) + "px";
		appContainer.style.left = (app.left < 10 ? 10 : app.left)  + "px";
	},
	
	/**
	 * Make AJAX request
	 * @param {string} type HTTP request method.
	 * @param {string} filename API adress to make connection.
	 * @param {string} parameters Parameters to send.
	 * @param {string} callback Function which runs after response return.
	 */
	makeRequest : function(type, filename, parameters, callback)
	{
		var request = new XMLHttpRequest();
		request.open(type, filename, true);
		request.onreadystatechange = function ()
		{
			if (request.readyState == 4)
			{
				if(request.status == 200)
					callback(request.responseText);
				else
					console.log("error: response status " + request.status);
			}
		};
		request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		request.send(parameters);
	},
	
	/**
	 * Create item from Task object.
	 * @param {Task} task Object with all task information.
	 */
	createItem : function(task)
	{
		var row = document.createElement("div");
		row.setAttribute("class", "list-row");
		row.className += " list-item";
		
		var checkButton = document.createElement("div");
		checkButton.setAttribute("class", "list-col");

		if(task.is_checked == 1)
		{
			checkButton.className += " task-checked";
			checkButton.addEventListener("click", app.uncheckItem);
		}	
		else
		{
			checkButton.className += " task-unchecked";
			checkButton.addEventListener("click", app.checkItem);
		}
		
		row.appendChild(checkButton);

		var taskContent = document.createElement("div");
		taskContent.setAttribute("class", "list-col");

		if(task.is_checked == 1)
		{
			taskContent.className += " task-done";
		}
		else
		{
			taskContent.className += " task-todo";
		}
		
		taskContent.setAttribute("draggable", "true");
		taskContent.innerHTML = task.content;
		
		taskContent.addEventListener("dragover", app.setDroppable);
		taskContent.addEventListener("dragstart", app.dropStart);
		taskContent.addEventListener("drop", app.dropOver);
						
		row.appendChild(taskContent);
		
		var deleteButton = document.createElement("div");
		deleteButton.setAttribute("class", "list-col");
		
		if(task.is_checked == 1)
		{
			deleteButton.className += " delete-unactive";
		}	
		else
		{
			deleteButton.className += " delete-active";
		}
		
		deleteButton.addEventListener("click", app.removeItem);
		
		row.appendChild(deleteButton);
		row.setAttribute("id", task.id);
		
		var section = document.getElementsByTagName("section")[0];
		section.insertBefore(row, section.childNodes[section.childNodes.length-2]);	
	},
	
	/**
	 * Create item from text input and send it to database.
	 */
	newItem : function()
	{
		var taskValue = document.getElementsByTagName("input")[0].value.trim();
		if(taskValue == "") {
			alert("Can't add empty task.");
			return;
		}

		app.makeRequest("post", "backend/api/insert/", "content=" + taskValue, function(data)
		{
			data = JSON.parse(data);
			if (data.success == true) {
				document.getElementsByTagName("input")[0].value = "";

				var newRow = document.createElement("div");
				newRow.setAttribute("class", "list-row");
				newRow.className += " list-item";
				
				var checkButton = document.createElement("div");
				checkButton.setAttribute("class", "list-col");
				checkButton.className += " task-unchecked";
				
				checkButton.addEventListener("click", app.checkItem);
				newRow.appendChild(checkButton);
	
				var taskContent = document.createElement("div");
				taskContent.setAttribute("class", "list-col");
				taskContent.className += " task-todo";
				taskContent.setAttribute("draggable", "true");
				taskContent.innerHTML = taskValue;
				
				taskContent.addEventListener("dragover", app.setDroppable);
				taskContent.addEventListener("dragstart", app.dropStart);
				taskContent.addEventListener("drop", app.dropOver);
										
				newRow.appendChild(taskContent);
				
				var deleteButton = document.createElement("div");
				deleteButton.setAttribute("class", "list-col");
				deleteButton.className += " delete-active";
				deleteButton.addEventListener("click", app.removeItem);
				
				newRow.appendChild(deleteButton);			
				newRow.setAttribute("id", data.id);
				
				var section = document.getElementsByTagName("section")[0];

				app.content.push ({ id: data.id, content: taskValue, is_checked: 0, order_number: app.content.length });

				section.insertBefore(newRow, section.childNodes[section.childNodes.length-2]);
				
				app.setPosition();
			}
			else 
			{
				alert("Can't add new item.");
			}
		});
	},
	
	/**
	 * Delete item from database and form.
	 */
	removeItem : function()
	{
		var parent = this.parentNode;

		app.makeRequest("post", "backend/api/delete/", "id=" + parent.getAttribute("id"), function(data)
		{
			data = JSON.parse(data);
			if (data.success == true) {		
				parent.parentNode.removeChild(parent);
			}
			else 
				alert("Can't delete it now.");
		});
	},
	
	/**
	 * Make item checked on form and database.
	 */
	checkItem : function()
	{
		this.className = "list-col";
		this.className += " task-checked";
		
		this.nextSibling.className = "list-col";
		this.nextSibling.className += " task-done";
		
		this.nextSibling.nextSibling.className = "list-col";
		this.nextSibling.nextSibling.className += " delete-unactive";
		
		this.removeEventListener("click", app.checkItem);
		this.addEventListener("click", app.uncheckItem);
		
		var parent = this.parentNode;
		app.makeRequest("post", "backend/api/check/", "id=" + parent.getAttribute("id"), function(data)
		{
			data = JSON.parse(data);
			if (data.success == false) {
				alert("We have problem now...");
			}
		});
	},
	
	/**
	 * Make item unchecked on form and database.
	 * @todo Merge this method with method checkItem().
	 */
	uncheckItem : function()
	{
		this.className = "list-col";
		this.className += " task-unchecked";
		
		this.nextSibling.className = "list-col";
		this.nextSibling.className += " task-todo";
		
		this.nextSibling.nextSibling.className = "list-col";
		this.nextSibling.nextSibling.className += " delete-active";
		
		this.removeEventListener("click", app.uncheckItem);
		this.addEventListener("click", app.checkItem);
		
		var parent = this.parentNode;
		app.makeRequest("post", "backend/api/check/", "id=" + parent.getAttribute("id"), function(data)
		{
			data = JSON.parse(data);
			if (data.success == false) {
				alert("We have problem now...");
			}
		});
	},
	
	setDroppable : function(event)
	{
		event.preventDefault();
	},
	
	onItemDrop : function()
	{
		event.preventDefault();
	},
	
	/**
	 * This method let save some data before droping element.
	 * We save mouse position, because it is necessary to determine where the item was dragged.
	 * @param {MouseEvent} This parameter is automaticaly injected.
	 */
	dropStart : function(event)
	{
		app.item = event.currentTarget.parentNode;
		app.mousePosition = event.pageY;
	},
	
	/**
	 * This method let read some data after droping element.
	 * @param {MouseEvent} This parameter is automaticaly injected.
	 */
	dropOver : function(event)
	{
		event.preventDefault();
		if(event.pageY < app.mousePosition)
		{
			event.target.parentNode.parentNode.insertBefore(app.item, event.currentTarget.parentNode);
			app.makeRequest("post", "backend/api/order-up/", "id1=" + app.item.getAttribute("id") + "&id2=" + event.currentTarget.parentNode.getAttribute("id"), function(data)
			{
				data = JSON.parse(data);
				if (data.success == false)
				{
					alert("We have an error.");
				}
			});
		}
		else
		{
			event.target.parentNode.parentNode.insertBefore(app.item, event.currentTarget.parentNode.nextSibling);
			app.makeRequest("post", "backend/api/order-down/", "id1=" + app.item.getAttribute("id") + "&id2=" + event.currentTarget.parentNode.getAttribute("id"), function(data)
			{
				data = JSON.parse(data);
				if (data.success == false)
				{
					alert("We have an error.");
				}
			});
		}
	},
	
	document : document.getElementsByTagName("html")[0],
	head : document.getElementsByTagName("head")[0],
	body : document.getElementsByTagName("body")[0],
	template : undefined,
	title : undefined,
	top: undefined,
	left: undefined,
	item: undefined,
	mousePosition: undefined,
	content: Array()
};

app.init("ToDO List", "en");