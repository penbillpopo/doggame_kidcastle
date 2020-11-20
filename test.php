<script type="text/javascript" src="lib/jquery-3.1.0.min.js"></script>
<script>
	$(document).ready(function(){
		//alert(location.href);
		let data=new URL(location.href);
		let hostname=data.hostname;
		let path=data.pathname;
		let protocol=data.protocol;
		let query=data.search;
		let params=data.searchParams;
		//alert(params);
		for(let [key, value] of params.entries())
		{
			console.log(`key: ${key}, value: ${value}`)
		}
	});
</script>