<script>
  import '../styles/app.scss'
</script>

<!-- MARKUP -->
<div>
  <nav>
    <a href="/">Home</a>
    <a href="/nested">Nested</a>
  </nav>
  <slot />
</div>

<!-- STYLES -->
<style lang="scss">
  div {
    box-sizing: border-box;
    min-width: 300px;
    min-height: 300px;
    resize: vertical;
    overflow: visible;
    display: flex;
    flex-flow: column;
    transition: all 0.15s ease-in-out;
  }
</style>
