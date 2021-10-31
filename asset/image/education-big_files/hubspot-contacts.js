( function( $, HubspotContacts ) {
	$.extend( HubspotContacts, {
		formValidator: function() { return true; },
		showMessage: function( msg, className ) {
			var $box = $( '.hubspot-contacts .messages' );

			// Removes any previous message
			$box.hide().find('.message').remove();

			// Appends new message with class
			$box.append( $( '<div>' ).addClass( 'message' ).addClass( className ).text( msg ) ).fadeIn();
		},
		initCheckAll: function( checkbox, selector ) {
			var $checkbox = $( checkbox );
			var $targets = $checkbox.parents( 'form' ).find( selector );

			$checkbox.on( 'change', function() {
				$targets.prop( 'checked', $checkbox.prop('checked') );
				$targets.trigger( 'change' );
			} );

			$targets.on( 'change', function() {
				$checkbox.prop( 'checked', ($targets.size() === $targets.filter( ':checked' ).size()) );
			} );

			$targets.trigger( 'change' );
		},
		handleAjaxRequest: function( $form, params ) {
			var obj = this;

			params.push( { name: obj.ajax_security_param, value: obj.ajax_security_value } );

			$.ajax( {
				url: this.ajaxurl,
				data: params,
				xhrFields: { withCredentials: true },
				type: 'post',
				dataType: 'json',
				success: function( data ) {
					if ( data.status === obj.STATUS_SUCCESS ) {
						obj.showMessage( data.message, data.status );
					} else if ( data.status === obj.STATUS_SIGNUP ) {
						obj.showMessage( data.message, data.status );
					} else if ( data.status === obj.STATUS_SETTINGS ) {
						var $settings = $( 'form[data-hubspot-ajax-action="hubspot_contacts_update"]' );

						for ( i in data.contact_data ) {
							var $property = $settings.find( '[name="' + HubspotContacts.form_container + '[' + i + ']"]' );

							if ( $property.is( '[type=checkbox]' ) ) {
								$property.prop( 'checked', data.contact_data[i] === 'true' );
								$property.trigger( 'change' );
							} else {
								$property.val( data.contact_data[i] )
							}
						}
					}
				},
				error: function( jqXHR ) {
					if ( jqXHR.responseText ) {
						message = JSON.parse(jqXHR.responseText)
						obj.showMessage(message, 'error');
					} else {
						// unknown error, may be lack of CORS so try http post
						$form.trigger( 'submit', true );
					}
				}
			} );
		},
		handleRecaptchaRequest: function( form, params ) {
			var obj = this;
			// Re-execute recaptcha.
			// Resolves issues where some elements may not be visible on load.
			grecaptcha.execute(
				obj.recaptcha_site_key,
				{ action: 'validate_captcha' }
			)
				.then(function(token) {
					document.getElementById('g-recaptcha-response').value = token;
					// Only make ajax request if we have generated a token.
					// We can safely assume if grecaptcha does not init, we will not.
					if ( token ) {
						obj.handleAjaxRequest( form, params );
					} else {
						return false;
					}
				});
		},
		initForm: function( form ) {
			var obj = this;
			var $form = $( form );

			$form.on( 'submit', function( e, disableAjax ) {
				if ( !obj.formValidator( $form ) ) {
					return false;
				}

				if ( ! disableAjax && $form.is( '[data-hubspot-ajax-action]' ) ) {
					e.preventDefault();

					var params = $form.serializeArray();
					params.push( {name: 'action', value: $form.data('hubspot-ajax-action')} );

					// Make request only if Recaptcha token is generated.
					obj.handleRecaptchaRequest( $form, params );
				}
			} );
		},
		init: function() {
			var obj = this;

			// Init reCaptcha.
			grecaptcha.ready(function() {
				$( '.newsletter-form input[type="hidden"]#g-recaptcha-response' ).each( function() {
					grecaptcha.render(
						this,
						{ "sitekey": obj.recaptcha_site_key }
					);
			});
			});

			$( '[data-hubspot-check-all]' ).each( function() {
				obj.initCheckAll( this, $( this ).data( 'hubspot-check-all' ) + ':not([data-hubspot-check-all])' );
			} );

			$( '.hubspot-contacts form' ).each( function() {
				obj.initForm( this );
			} );
		}
	} );
	$( function() {
		HubspotContacts.init();
	} );
} )( jQuery, HubspotContacts );
