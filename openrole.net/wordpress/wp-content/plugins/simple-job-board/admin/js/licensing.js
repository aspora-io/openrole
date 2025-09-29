(function ($) {
  $(document).ready(function () {   

    $(".activate a").click(function (e) {
      var linkId = $(this).attr("id").replace("activate-", "");
    });

    $(".sjbl-discard").click(function (e) {
      e.preventDefault();
      $(".sjb-license-popup-wrapper").fadeOut(500);
    });

    /** License Activation start */
    $("body").on("click", ".activate_license", function (e) {
      e.preventDefault();
      var addon_name = $(this).data("addon");
      activation_request(addon_name);
    });   
  });

  const activation_request = (addon_name) => {
    var addon_input = $("a[data-addon='" + addon_name + "']").parent(
      "div.activation-input-controls"
    );

    var license_key = addon_input.find(".sjb-license-key").val();
    var email_addr = addon_input.find(".sjb-email-addr").val();
    var license_nonce = addon_input.find(".license-activation-nonce").val();
    

    if (!license_key && !email_addr) {
      $("." + addon_name + "-error").text('Enter your email address and license key.');     
      $(".activate_license").removeClass("updating-message");
      $(".sjb-error").show();      
      return false;
    } else if (!license_key) {
      $(".activate_license").removeClass("updating-message");
      $("." + addon_name + "-error").text('Please enter license key.');        
      $(".sjb-error").show();        
      return false;
    } else if (!email_addr) {
      $(".activate_license").removeClass("updating-message");
      $("." + addon_name + "-error").text('Please enter your email address.');
      $(".sjb-error").show();      
      return false;
    }

    $.ajax({
      type: "PATCH",
      url: sjbl.license_activation,

      data: {
        license_key: license_key,
        email_addr: email_addr,
        domain: sjbl.site_url,
        addon: addon_name        
      },
      beforeSend: function () {
          
        $(".sjb-success").hide();
        $(".sjb-error").hide();
      },
      success: function (res, status) {
        if (status == 'success' && res.status === 200) {
            console.log(res.data);
          validateRequestUpdate(addon_name, res.data, license_nonce);
          $(".activation-input-controls").hide();
        }

      },
      error: function (e, status) {
        var data = jQuery.parseJSON(e.responseText);
        console.log("Error: ", e);
        console.log("Status: ", status);
        $("." + addon_name + "-error").text(data.message);
        $(".activate_license").removeClass("updating-message");
        $(".sjb-error").show();
      }
    });
  };

  function validateRequestUpdate(addon_name, data, license_nonce) {
    $.ajax(sjbl.ajax_url, {
      type: "POST",
      data: {
        action: "validate_request_update",
        data: data,
        addon: addon_name,   
        license_activation_nonce: license_nonce
      },
      success: function (res, status) {
        console.log("validate_request_update ", res);
        if (res.activated == true) {            
          $("." + addon_name + "-success").text(res.message);
          $(".activate_license").removeClass("updating-message");
          $(".sjb-success").show();
          setTimeout(function () {
            location.reload();
          }, 3000);
        } else {
          $("." + addon_name + "-error").text(data.message);
          $(".activate_license").removeClass("updating-message");
          $(".sjb-error").show();
        }
      },
      error: function (e) {
        $("." + addon_name + "-error").text(data.message);
        $(".activate_license").removeClass("updating-message");
        $(".sjb-error").show();
      }
    });
  }
})(jQuery);