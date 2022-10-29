window.tweetin_start = function(){
	document.getElementById("Tweetin_mainpage_wellcome_window").style.opacity = 0;
	setTimeout(function(){
		document.getElementById("Tweetin_mainpage_wellcome_window").style.display = "none";
	}, 1000);
	
	document.getElementById("Tweetin_mainpage_main").style.display = "block";
	setTimeout(function(){
		document.getElementById("Tweetin_mainpage_main").style.opacity = 1;
	}, 20);
};

window.create_post_element = function(post_data){
	var a = document.createElement("div");
	a.style = "width: 100%; ";
	var b = document.createElement("div");
	b.classList.add("Tweetin_post_container");
	var c = document.createElement("div");
	c.style = "width: 100%; height: 50px; border-bottom: 1px solid lightblue;  display: flex; justify-content: center; align-items: center; ";
	var d = document.createElement("div");
	d.style = "width: 100%; height: 40px; position: relative; ";
	var e1 = document.createElement("div");
	e1.style = "position: absolute; top: 0px; bottom: 0px; left: 20px; width: 40px; ";
	var f = document.createElement("img");
	f.style = "width: 100%; height: 100%; ";
	f.src = post_data.author.profile_url;
	e1.appendChild(f);
	d.appendChild(e1);
	var e2 = document.createElement("div");
	e2.style = "position: absolute; top: 0px; bottom: 0px; left: 70px; right: 0px; ";
	var f2 = document.createElement("div");
	f2.style = "width: 100%; height: 16px; font-weight: bold; ";
	f2.innerText = post_data.author.full_name;
	e2.appendChild(f2);
	var f3 = document.createElement("div");
	f3.style = "width: 100%; height: 14px; font-weight: small; font-size: 11px;";
	f3.innerText = post_data.author.abbo_text;
	e2.appendChild(f3);
	d.appendChild(e2);
	c.appendChild(d);
	b.appendChild(c);
	var g = document.createElement("div");
	g.style = "height: 200px; width: calc( 100% - 5px ); margin-top: 20px; overflow: hidden; margin-left: 5px; ";
	g.innerText = post_data.text;
	b.appendChild(g);
	var h = document.createElement("div");
	h.style = "width: 100%; height: 27px; border-top: 1px solid lightblue; display: flex; justify-content: space-around; align-items: center;";
	[{"name": "love", "url": "/images/heart.png"}, {"name": "like", "url": "/images/like.png"}, {"name": "dislike", "url": "/images/dislike.png"}].forEach(function(data){
		var i = document.createElement("div");
		i.style = "height: 19px; width: 65px; border: 1px solid blue; border-radius: 5px; position: relative; ";
		var j1 = document.createElement("div");
		j1.style = "position: absolute; top: 2px; left: 3px; bottom: 2px; width: 15px;"
		var k = document.createElement("img");
		k.style = "width: 100%; height: 100%; ";
		k.src = data.url;
		j1.appendChild(k);
		i.appendChild(j1);
		var j2 = document.createElement("div");
		j2.style = "position: absolute; top: 0px; left: 18px; bottom: 0px; right: 0px; display: flex; justify-content: center; align-items: center; ";
		j2.innerText = post_data.reactions[data.name];
		i.appendChild(j2);
		h.appendChild(i);
	});
	b.appendChild(h);
	var l = document.createElement("div");
	l.style = "width: 100%; height: 29px; display: flex; justify-content: center; align-items: center; ";
	var m = document.createElement("a");
	m.style = "font-size: 10px; ";
	m.innerText = "Kommentare anzeigen ("+post_data.comments_count+")";
	m.href = "#";
	l.appendChild(m);
	a.appendChild(l);
	a.appendChild(b);
	return a;
};
window.tweetin_add_post_to_feed = function(post_data){
	var new_el = create_post_element(post_data);
	document.getElementById("Tweetin_feed_container").prepend(new_el);
};
