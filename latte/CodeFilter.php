<?php

namespace App\Latte;

class CodeFilter
{

	public static function execute($value, $type = null, $mirror = null): \Latte\Runtime\Html
	{
		if ($mirror) {
			$mirror = $value;
		}

		return new \Latte\Runtime\Html("$mirror<pre><code class='language-{$type}'>$value</code></pre>");
	}
}
