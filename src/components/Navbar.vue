<template>
  <nav class="top-nav">
    <div class="nav-container">
      <router-link to="/" class="brand-logo">MyBrand</router-link>
      <ul class="nav-menu">
        <li>
          <router-link to="/all-items" class="nav-link">All Item</router-link>
        </li>
        <li>
          <router-link to="/new" class="nav-link">NEW ARRIVAL</router-link>
        </li>
        <li><router-link to="/sales" class="nav-link">Sales</router-link></li>
        <li><a href="#" class="nav-link">sign in</a></li>
        <li><a href="#" class="nav-link">sign up</a></li>
      </ul>
    </div>
  </nav>
</template>

<script setup></script>
